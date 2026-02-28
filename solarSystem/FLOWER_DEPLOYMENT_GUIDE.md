# 🌹 鲜花系统集成部署指南

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                   客户端 (浏览器)                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Express.js 服务器 (Node.js)                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth.js    │  │ Flowers.ts   │  │  Earth.js    │  │
│  │  (认证路由)   │  │ (鲜花路由)   │  │ (墓地路由)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                          ↓                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            GraveFlowerService                        │ │
│  │  ├─ getFlowerConfig()                               │ │
│  │  ├─ donateFlower()                                  │ │
│  │  ├─ addComment()                                    │ │
│  │  ├─ likeGrave()                                     │ │
│  │  └─ ...                                             │ │
│  └─────────────────────────────────────────────────────┘ │
│                          ↓                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Database Layer                         │ │
│  │  (MySQL / SQLite)                                   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   MySQL 数据库                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ grave_flower_config  │ grave_likes                  ││
│  │ user_flower_purchases│ grave_comments              ││
│  │ grave_flower_donations│ comment_likes              ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 部署步骤

### 步骤 1: 更新依赖（如需要）

```bash
cd /Users/macbookpro/codetest/solarSystem/solarSystem

# 安装或更新依赖（如果有新的包）
npm install
```

### 步骤 2: 配置数据库

检查 `.env` 文件中的数据库配置：

```bash
# 查看现有配置
cat .env | grep DB_

# 示例输出：
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=solar_system
# DB_TYPE=mysql
```

确保配置正确连接到你的 MySQL 数据库。

### 步骤 3: 运行数据库迁移

```bash
# 确保数据库服务运行
# macOS (使用 Homebrew)
brew services start mysql

# 运行迁移脚本
bash database-migration-flowers.sh
```

**预期输出：**
```
🌹 开始墓地鲜花系统数据库迁移...
📝 数据库配置:
  主机: localhost:3306
  数据库: solar_system
  用户: root
📊 执行数据库迁移...
✅ 鲜花系统数据库迁移成功！
```

### 步骤 4: 验证数据库表

```bash
mysql -h localhost -u root -p solar_system << EOF
SHOW TABLES LIKE 'grave_%';
SHOW TABLES LIKE 'comment_%';
SHOW TABLES LIKE 'user_flower_%';
EOF
```

**预期输出应包括：**
```
comment_likes
comment_likes_v1
grave_comments
grave_flower_config
grave_flower_donations
grave_likes
user_flower_purchases
```

### 步骤 5: 构建 TypeScript

```bash
# 编译 TypeScript 文件
npm run build

# 或仅编译服务器代码
npx tsc -p tsconfig.server.json
```

### 步骤 6: 启动服务器

```bash
# 开发模式（带自动重启）
npm run server

# 或生产模式
NODE_ENV=production npm start
```

**预期输出：**
```
✅ Server is running
📡 Port: 3000
🌍 Environment: development
🔐 Database: mysql
⏰ Started at: 2024-01-15T10:30:00Z
```

### 步骤 7: 测试系统

```bash
# 在另一个终端运行测试
bash test-flower-system.sh
```

**预期输出：**
```
🌹 开始测试墓地鲜花系统...

=========================================
🌻 鲜花配置 API 测试
=========================================
测试: 获取鲜花配置 ... ✅ PASS (HTTP 200)

[... 更多测试结果 ...]

=========================================
📊 测试汇总
=========================================
✅ 通过: 12
❌ 失败: 0

✅ 所有测试通过！
```

---

## 验证清单

在生产环境部署前，请确认以下项目：

### 代码检查
- [ ] `server/services/GraveFlowerService.ts` 已创建
- [ ] `server/routes/flowers.ts` 已创建
- [ ] `server/types/flower.ts` 已创建
- [ ] `server/index.ts` 已更新（导入鲜花路由）
- [ ] `server/routes/auth.js` 已更新（初始化鲜花配置）

### 数据库检查
- [ ] 6 个新表已创建
- [ ] 外键关系正确
- [ ] 唯一约束已设置
- [ ] 索引已建立
- [ ] 默认鲜花配置已初始化

### 功能检查
- [ ] 鲜花配置 API 返回正确数据
- [ ] 可以创建购买订单
- [ ] 可以赠送鲜花（支付后）
- [ ] 点赞系统正常工作
- [ ] 评论系统正常工作
- [ ] 防止重复操作（点赞、评论）

### 安全检查
- [ ] 敏感路由需要认证
- [ ] 管理员功能有权限检查
- [ ] SQL 注入防护（使用参数化查询）
- [ ] CSRF 防护（使用 session）
- [ ] 输入验证（评论长度限制等）

---

## 文件更改总结

### 新增文件

```
solarSystem/
├── server/
│   ├── services/
│   │   └── GraveFlowerService.ts              [NEW] 30+ 个方法
│   ├── routes/
│   │   └── flowers.ts                        [NEW] 12 个 API 端点
│   ├── types/
│   │   └── flower.ts                         [NEW] 10 个 TypeScript 接口
│   └── database/
│       └── schema.flower.ts                  [NEW] 6 个数据库表定义
├── database-migration-flowers.sh              [NEW] 数据库迁移脚本
├── test-flower-system.sh                     [NEW] 测试脚本
├── FLOWER_SYSTEM_GUIDE.md                    [NEW] 完整文档
└── FLOWER_API_QUICK_REFERENCE.md             [NEW] API 快速参考
```

### 修改的文件

```
solarSystem/
├── server/
│   ├── index.ts                              [MODIFIED] 导入鲜花路由
│   └── routes/auth.js                        [MODIFIED] 初始化鲜花配置
```

### 文件变化统计

| 类型 | 数量 |
|------|------|
| 新增文件 | 8 |
| 修改文件 | 2 |
| 新增代码行 | ~2000+ |
| 新增数据库表 | 6 |
| 新增 API 端点 | 12 |
| 新增服务方法 | 30+ |

---

## 升级现有系统

如果你之前已部署过墓地购买系统，只需：

1. **复制新文件**
   ```bash
   # 复制服务文件
   cp server/services/GraveFlowerService.ts /your/server/services/
   
   # 复制路由文件
   cp server/routes/flowers.ts /your/server/routes/
   
   # 复制类型文件
   cp server/types/flower.ts /your/server/types/
   
   # 复制数据库定义
   cp server/database/schema.flower.ts /your/server/database/
   ```

2. **更新主服务器文件**
   - 在 `server/index.ts` 中添加 `import flowerRoutes from './routes/flowers'`
   - 在 `server/index.ts` 中添加 `app.use('/api/flowers', flowerRoutes)`
   - 在 `server/routes/auth.js` 中添加鲜花配置初始化

3. **运行数据库迁移**
   ```bash
   bash database-migration-flowers.sh
   ```

4. **重启服务器**
   ```bash
   npm run server
   ```

---

## 开发和测试

### 本地开发环境设置

```bash
# 1. 启动 MySQL
brew services start mysql

# 2. 创建测试数据库
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS solar_system_test;
USE solar_system_test;
SOURCE database-migration-flowers.sh;
EOF

# 3. 启动开发服务器
npm run server

# 4. 在另一个终端运行测试
bash test-flower-system.sh
```

### 调试技巧

```bash
# 启用详细日志
DEBUG=* npm run server

# 检查数据库中的数据
mysql -u root -p solar_system << EOF
SELECT * FROM grave_flower_config;
SELECT * FROM grave_likes LIMIT 5;
SELECT * FROM grave_comments LIMIT 5;
EOF

# 监看 API 调用
curl -v http://localhost:3000/api/flowers/config
```

---

## 故障处理

### 问题 1: 迁移脚本失败

**错误：** `Access denied for user 'root'@'localhost'`

**解决方案：**
```bash
# 编辑脚本中的密码
nano database-migration-flowers.sh

# 或使用环境变量
export DB_PASSWORD=your_password
bash database-migration-flowers.sh
```

### 问题 2: 路由未找到

**错误：** `404 Not Found /api/flowers/config`

**检查清单：**
1. 确保 `server/routes/flowers.ts` 已存在
2. 确保 `server/index.ts` 导入了路由：
   ```typescript
   import flowerRoutes from './routes/flowers';
   app.use('/api/flowers', flowerRoutes);
   ```
3. 重新构建 TypeScript
4. 重启服务器

### 问题 3: 鲜花配置为空

**错误：** 获取鲜花配置时返回空数组

**解决方案：**
1. 手动初始化配置：
   ```bash
   # 使用 node 命令
   node -e "require('./dist/server/services/GraveFlowerService').GraveFlowerService.initializeFlowerConfig()"
   ```
2. 或注册一个新用户（自动初始化）
3. 检查数据库中是否有数据：
   ```bash
   mysql -u root -p solar_system -e "SELECT * FROM grave_flower_config;"
   ```

### 问题 4: 点赞重复错误

**错误：** `您已经点赞过这个墓地`

**原因：** 用户尝试重复点赞

**解决方案：**
先取消点赞再点赞：
```bash
curl -X DELETE http://localhost:3000/api/flowers/graves/1/like
curl -X POST http://localhost:3000/api/flowers/graves/1/like
```

---

## 性能优化

### 1. 数据库查询优化

```sql
-- 添加复合索引加速查询
ALTER TABLE grave_flower_donations ADD INDEX idx_grave_donated (grave_id, donated_at DESC);
ALTER TABLE grave_comments ADD INDEX idx_grave_created (grave_id, created_at DESC);
```

### 2. 缓存配置

```javascript
// 在 GraveFlowerService 中添加缓存
const flowerConfigCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时

static async getAllFlowerConfigs() {
  const cacheKey = 'flower_config';
  if (flowerConfigCache.has(cacheKey)) {
    const cached = flowerConfigCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  
  const result = await database.query(...);
  flowerConfigCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}
```

### 3. 连接池配置

在 `server/database/index.ts` 中配置：
```typescript
const pool = mysql.createPool({
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
});
```

---

## 监控和日志

### 应用日志

```bash
# 查看实时日志
tail -f server.log | grep "flower"

# 搜索错误
grep -i "error" server.log | grep "flower"
```

### 数据库监控

```bash
# 检查表大小
mysql -u root -p solar_system << EOF
SELECT TABLE_NAME, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'solar_system' 
AND TABLE_NAME LIKE '%flower%';
EOF
```

### 关键指标

监控以下指标来评估系统健康状况：

- **API 响应时间** - 应 < 200ms
- **数据库查询时间** - 应 < 100ms
- **错误率** - 应 < 0.1%
- **活跃用户数** - 从评论和点赞推断
- **花朵销售额** - 从 `user_flower_purchases` 计算

---

## 回滚计划

如需回滚鲜花系统：

```bash
# 1. 停止服务器
pkill -f "npm run server"

# 2. 恢复代码版本
git revert HEAD

# 3. 删除数据库表（可选）
mysql -u root -p solar_system << EOF
DROP TABLE comment_likes;
DROP TABLE grave_comments;
DROP TABLE grave_likes;
DROP TABLE grave_flower_donations;
DROP TABLE user_flower_purchases;
DROP TABLE grave_flower_config;
EOF

# 4. 重启服务器
npm run server
```

---

## 更新和维护

### 月度维护清单

- [ ] 检查数据库大小增长
- [ ] 清理过期的点赞和评论（可选）
- [ ] 更新鲜花价格（如需要）
- [ ] 审查用户反馈
- [ ] 备份数据库

### 常见更新

**添加新花卉类型：**
```sql
INSERT INTO grave_flower_config 
(flower_type, flower_name, flower_emoji, usdt_price, description, is_available)
VALUES ('daisy', '雏菊', '🌼', 1.5, '象征纯净', 1);
```

**调整价格：**
```sql
UPDATE grave_flower_config 
SET usdt_price = 1.2 
WHERE flower_type = 'rose';
```

---

## 生产环境最佳实践

### 1. 环境配置

```bash
# .env.production
NODE_ENV=production
DB_HOST=prod-db.example.com
DB_USER=prod_user
DB_PASSWORD=strong_password
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=long_random_string
```

### 2. 安全加固

```bash
# 启用 HTTPS
NODE_ENV=production npm start

# 使用环境变量管理敏感信息
export DB_PASSWORD="$(aws secretsmanager get-secret-value --secret-id db-password --query SecretString --output text)"
```

### 3. 备份策略

```bash
# 每日备份数据库
0 2 * * * mysqldump -u root -p solar_system | gzip > /backups/solar_system_$(date +\%Y\%m\%d).sql.gz

# 保留 30 天的备份
0 3 * * * find /backups -name "*.sql.gz" -mtime +30 -delete
```

### 4. 监控告警

配置服务监控工具（如 PM2, Supervisor）：

```bash
# 使用 PM2
npm install -g pm2
pm2 start ecosystem.config.js

# 启用自动重启
pm2 startup
pm2 save
```

---

## 总结

✅ **完整部署涵盖：**
- 8 个新文件（2000+ 行代码）
- 6 个数据库表
- 12 个 API 端点
- 30+ 个服务方法
- 完整的文档和测试脚本

🚀 **部署时间：** ~10-15 分钟

💾 **数据库影响：** +6 个表，不影响现有数据

🔄 **向后兼容：** 完全向后兼容现有的墓地系统

---

## 获取支持

遇到问题？
1. 查看 `FLOWER_SYSTEM_GUIDE.md` 完整文档
2. 运行 `test-flower-system.sh` 诊断
3. 查看应用日志：`npm run server 2>&1 | tee app.log`
4. 检查数据库连接

🌹 感谢使用鲜花系统！祝部署顺利！
