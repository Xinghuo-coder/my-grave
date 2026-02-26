# 性能优化分析报告

## 🎯 目标场景
- **在线用户**: 10万并发用户
- **核心操作**: 注册、登录、地球热点查询
- **部署环境**: Google Cloud Run + Cloud SQL (MySQL)

---

## ❌ 发现的严重问题

### 1. **数据库架构问题** (严重 🔴)

#### 问题描述
- **SQLite单线程限制**: SQLite不支持高并发写入,10万用户会导致严重的锁竞争
- **回调地狱**: 所有数据库操作使用callback,代码难以维护且性能差
- **缺少连接池**: SQLite没有连接池概念,每次操作都是同步等待
- **路由直接引用db**: `earth.js`等路由文件直接使用SQLite db实例

#### 影响
```
10万用户并发 → SQLite锁等待 → 响应时间 >5秒 → 用户体验崩溃
```

#### 解决方案
- ✅ 已准备MySQL连接池 (db-mysql.js)
- ⚠️ 需要将所有路由和模型迁移到MySQL
- ⚠️ 需要将callback改为async/await

---

### 2. **缺少缓存层** (严重 🔴)

#### 问题描述
- **每次查询都打DB**: 热点数据、用户信息每次都查询数据库
- **Session存储在内存**: express-session默认存储,单实例重启丢失,多实例无法共享
- **验证码存储在DB**: 每个验证码请求都写入数据库,高并发会拖垮DB

#### 影响
```
10万用户 × 每分钟1次查询 = 166,667 QPS → 数据库过载
```

#### 解决方案
```javascript
// 添加 Redis 缓存层
- Session → Redis (express-session + connect-redis)
- 验证码 → Redis (TTL自动过期)
- 热点数据 → Redis (缓存用户热点列表)
- 用户信息 → Redis (缓存登录用户信息)
```

---

### 3. **bcrypt性能瓶颈** (中等 🟡)

#### 问题描述
```javascript
const SALT_ROUNDS = 10; // 2^10 = 1024次hash,每次约100ms
```

- **注册/登录慢**: 10 rounds在高并发下每秒只能处理10-20个请求
- **阻塞事件循环**: bcrypt.hash()和compare()是CPU密集型操作

#### 影响
```
100个并发注册 × 100ms = 10秒响应时间
```

#### 解决方案
```javascript
// 降低到8 rounds (256次hash,约25ms)
const SALT_ROUNDS = 8; // 安全性仍足够,性能提升4倍

// 或使用异步队列
const Queue = require('bull');
const hashQueue = new Queue('password-hashing', redisConfig);
```

---

### 4. **验证码防刷漏洞** (严重 🔴)

#### 问题描述
```javascript
// 当前实现:无限制发送验证码
router.post('/send-code', async (req, res) => {
  // 直接发送,没有频率限制
  await VerificationService.sendEmailCode(target, purpose);
});
```

- **恶意刷验证码**: 攻击者可无限发送,导致数据库爆炸
- **短信费用爆炸**: 如果接入真实短信服务,费用失控
- **数据库垃圾数据**: verification_codes表无限增长

#### 影响
```
攻击者10万次请求 → 短信费用10万元 + DB崩溃
```

#### 解决方案
```javascript
// 1. IP级别限制 (已有,但需加强)
// 2. 手机号/邮箱级别限制
const verifyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 同一目标1分钟只能1次
  keyGenerator: (req) => req.body.target // 按邮箱/手机限制
});

// 3. 清理过期验证码
setInterval(async () => {
  await db.query('DELETE FROM verification_codes WHERE expires_at < NOW()');
}, 3600000); // 每小时清理
```

---

### 5. **路由层数据库耦合** (严重 🔴)

#### 问题描述
```javascript
// earth.js 直接引用 SQLite db
const db = require('../database/db'); // ❌ 耦合SQLite

router.get('/my-hotspots', (req, res) => {
  db.all(sql, [userId], (err, rows) => { // ❌ callback + SQLite特定API
    // ...
  });
});
```

- **无法切换数据库**: 生产环境要用MySQL,但路由写死了SQLite
- **重复代码**: 每个路由都有相同的错误处理
- **难以测试**: 无法mock数据库

#### 解决方案
```javascript
// 创建统一数据库服务层
class HotspotService {
  static async getUserHotspots(userId) {
    const pool = getPool(); // 自动选择MySQL或SQLite
    const [rows] = await pool.query(
      'SELECT * FROM earth_hotspots WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }
}

// 路由层调用服务
router.get('/my-hotspots', async (req, res) => {
  try {
    const hotspots = await HotspotService.getUserHotspots(req.session.user.id);
    res.json({ success: true, hotspots });
  } catch (error) {
    next(error); // 统一错误处理
  }
});
```

---

### 6. **缺少数据库索引** (中等 🟡)

#### 问题描述
```javascript
// 当前只有基础主键索引
CREATE TABLE earth_hotspots (
  id INTEGER PRIMARY KEY, // ✅ 主键索引
  user_id INTEGER,        // ❌ 没有索引
  created_at DATETIME     // ❌ 没有索引
)
```

- **慢查询**: `WHERE user_id = ?` 需要全表扫描
- **排序慢**: `ORDER BY created_at DESC` 无索引排序

#### 影响
```
100万条hotspot数据 → 查询时间从1ms增长到1000ms
```

#### 解决方案
```sql
-- 复合索引优化
CREATE INDEX idx_hotspot_user_created ON earth_hotspots(user_id, created_at DESC);

-- 用户表索引
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_username ON users(username);

-- 验证码表索引
CREATE INDEX idx_verification_target_expires ON verification_codes(target, expires_at);
```

---

### 7. **Session扩展性问题** (严重 🔴)

#### 问题描述
```javascript
// 当前配置:内存存储
app.use(session({
  secret: 'dev-solar-system-secret-key-2026',
  resave: false,
  saveUninitialized: false
  // ❌ 没有指定store,默认MemoryStore
}));
```

- **单实例限制**: Cloud Run多实例部署,session无法共享
- **内存泄漏**: 10万用户 × 1KB session = 100MB内存,重启丢失
- **无法水平扩展**: 用户A登录到实例1,下次请求到实例2会丢失登录状态

#### 影响
```
用户登录 → 实例1 → 下次请求 → 实例2 → 未登录(需重新登录)
```

#### 解决方案
```javascript
// 使用Redis存储session (已准备但未启用)
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL
});
redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
}));
```

---

### 8. **缺少监控和日志** (中等 🟡)

#### 问题描述
- **没有性能监控**: 无法知道哪个API慢
- **没有错误追踪**: 生产环境错误难以定位
- **没有请求日志**: 无法分析用户行为

#### 解决方案
```javascript
// 1. 添加请求日志
const morgan = require('morgan');
app.use(morgan('combined'));

// 2. 性能监控
const responseTime = require('response-time');
app.use(responseTime((req, res, time) => {
  if (time > 1000) { // 慢查询告警
    console.warn(`⚠️ Slow request: ${req.method} ${req.url} - ${time}ms`);
  }
}));

// 3. 错误追踪 (Sentry)
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

### 9. **API响应缓存缺失** (中等 🟡)

#### 问题描述
```javascript
// 每次都查询数据库
router.get('/my-hotspots', (req, res) => {
  db.all(sql, [userId], (err, rows) => {
    res.json({ success: true, hotspots: rows });
  });
});
```

- **重复查询**: 用户刷新页面,每次都查DB
- **浪费资源**: 热点数据很少变化,但每次都查

#### 解决方案
```javascript
// HTTP缓存头
router.get('/my-hotspots', async (req, res) => {
  const hotspots = await HotspotService.getUserHotspots(req.session.user.id);
  
  // 设置缓存头
  res.set('Cache-Control', 'private, max-age=60'); // 客户端缓存60秒
  res.set('ETag', hashData(hotspots)); // 支持304 Not Modified
  
  res.json({ success: true, hotspots });
});

// Redis缓存
const cacheKey = `hotspots:user:${userId}`;
let hotspots = await redis.get(cacheKey);
if (!hotspots) {
  hotspots = await db.query(...);
  await redis.setex(cacheKey, 300, JSON.stringify(hotspots)); // 5分钟
}
```

---

## 📊 性能对比预估

### 优化前 (当前架构)
```
并发用户: 100 → 响应时间: 2-5秒
并发用户: 1,000 → 响应时间: 10-30秒
并发用户: 10,000 → 系统崩溃 ❌
```

### 优化后 (推荐架构)
```
并发用户: 100 → 响应时间: 50-100ms
并发用户: 1,000 → 响应时间: 100-200ms
并发用户: 10,000 → 响应时间: 200-500ms
并发用户: 100,000 → 响应时间: 500ms-1s ✅
```

---

## 🏗️ 推荐架构

```
┌─────────────┐
│   用户请求   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Cloud Run (多实例,自动扩展)         │
│  ├─ Nginx/CDN (静态资源缓存)        │
│  ├─ Express.js (API服务器)          │
│  └─ Node.js Cluster (多进程)        │
└──────┬─────────────────┬────────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌─────────────────┐
│ Cloud SQL    │  │ Redis (缓存)    │
│ (MySQL主从)  │  │ ├─ Session     │
│ ├─ 用户数据  │  │ ├─ 验证码      │
│ ├─ 热点数据  │  │ └─ 查询缓存    │
│ └─ 只读副本  │  └─────────────────┘
└──────────────┘
       │
       ▼
┌──────────────┐
│ Cloud CDN    │
│ (全球加速)   │
└──────────────┘
```

---

## ✅ 优化优先级

### P0 (必须立即修复)
1. **迁移到MySQL** - SQLite无法支撑生产环境
2. **添加Redis缓存** - Session和验证码必须用Redis
3. **修复回调地狱** - 改为async/await
4. **验证码防刷** - 防止恶意攻击

### P1 (上线前完成)
5. **添加数据库索引** - 优化查询性能
6. **降低bcrypt复杂度** - 从10降到8
7. **统一数据库访问层** - 解耦路由和数据库
8. **添加监控日志** - 生产环境必备

### P2 (上线后优化)
9. **API响应缓存** - 提升响应速度
10. **数据库读写分离** - MySQL主从架构

---

## 📝 下一步行动

1. **立即**: 将SQLite改为MySQL (已有配置,需要迁移代码)
2. **立即**: 添加Redis服务 (安装connect-redis)
3. **24小时内**: 重构所有路由为async/await
4. **24小时内**: 添加验证码防刷机制
5. **48小时内**: 添加数据库索引
6. **72小时内**: 压力测试 (使用artillery/k6)

---

生成时间: 2026-02-26
目标: 支持10万并发用户
状态: ⚠️ 需要紧急优化
