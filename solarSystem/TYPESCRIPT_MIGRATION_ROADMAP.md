# 🎯 TypeScript 迁移路线图

## 一、现状分析

### 文件清单（需要迁移）

```
需迁移的 JavaScript 文件（共 16 个）:

【服务层 - Services】
✏️ server/services/HotspotService.js           (200+ 行)
✏️ server/services/UserService.js              (150+ 行)
✏️ server/services/VerificationCodeService.js  (100+ 行)
✏️ server/services/verificationService.js      (80+ 行)

【模型层 - Models】
✏️ server/models/User.js                       (80+ 行)
✏️ server/models/VerificationCode.js           (60+ 行)

【数据库层 - Database】
✏️ server/database/db.js                       (100+ 行)
✏️ server/database/db-mysql.js                 (150+ 行)
✏️ server/database/index.js                    (50+ 行)
✏️ server/database/migrate-to-mysql.js         (100+ 行)

【路由层 - Routes】
⚠️  server/routes/auth.js                      (400+ 行) [有优化版本]
⚠️  server/routes/auth_optimized.js            (400+ 行) [重复]
⚠️  server/routes/earth.js                     (250+ 行) [有优化版本]
⚠️  server/routes/earth_optimized.js           (250+ 行) [重复]

【配置和中间件 - Config & Middleware】
✏️ server/config/environment.js                (50+ 行)
✏️ server/config/secrets.js                    (30+ 行)
✏️ server/config/session-store.js              (50+ 行)
✏️ server/middleware/auth.js                   (80+ 行)
✏️ server/middleware/monitoring.js             (80+ 行)
✏️ server/middleware/security.js               (100+ 行)

【实用函数】
✏️ server/database/index.js                    (50+ 行)
✏️ server/services/HotspotService.js           (200+ 行)

已有的 TypeScript 文件（保留）:
✅ 所有 server/types/*.ts                      (10+ 文件)
✅ 所有 server/routes/*.ts                     (6+ 文件)  
✅ 所有 server/services/*.ts                   (5+ 文件)
✅ server/index.ts
✅ server/config/grave-purchase.ts
✅ tsconfig.server.json
```

## 二、迁移优先级

### 依赖关系图

```
🟥 第 1 优先级（基础层 - 0-3 天）
├─ server/config/environment.js         (环境配置 - 无依赖)
├─ server/config/secrets.js             (密钥配置 - 无依赖)
└─ server/config/session-store.js       (Session 配置 - 无依赖)

🟧 第 2 优先级（中间件层 - 3-5 天）
├─ server/middleware/auth.js            (认证中间件)
├─ server/middleware/monitoring.js      (监控中间件)
├─ server/middleware/security.js        (安全中间件)
└─ server/middleware/authorization.ts   (已存在)

🟨 第 3 优先级（模型和服务基础 - 5-8 天）
├─ server/models/User.js                (用户模型 - 被多处依赖)
├─ server/models/VerificationCode.js    (验证码模型)
├─ server/database/db.js                (数据库通用层)
└─ server/database/db-mysql.js          (MySQL 驱动)

🟩 第 4 优先级（业务服务层 - 8-12 天）
├─ server/services/UserService.js       (用户服务)
├─ server/services/HotspotService.js    (热点服务)
├─ server/services/VerificationCodeService.js
└─ server/services/verificationService.js

🔵 第 5 优先级（数据库工具 - 12-13 天）
├─ server/database/index.js             (数据库初始化)
└─ server/database/migrate-to-mysql.js  (数据库迁移脚本)

🟦 第 6 优先级（路由层 - 13-16 天）[最复杂]
├─ server/routes/auth.js (400+ 行)      → 合并两个版本
├─ server/routes/auth_optimized.js      → 删除
├─ server/routes/earth.js (250+ 行)     → 合并两个版本
└─ server/routes/earth_optimized.js     → 删除

🎯 第 7 优先级（入口点 - 16-17 天）
└─ server/index.js                      (应用入口)
```

## 三、具体迁移步骤示例

### 示例 1：迁移 UserService.js → UserService.ts

#### 迁移前：
```javascript
// server/services/UserService.js
class UserService {
  async getUserById(userId) {
    const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (result.length === 0) {
      throw new Error('User not found');
    }
    return result[0];
  }

  async updateUser(userId, updates) {
    const result = await db.query(
      'UPDATE users SET ? WHERE id = ?',
      [updates, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = UserService;
```

#### 迁移后：
```typescript
// server/services/UserService.ts
import { User } from '../types/user';

class UserService {
  /**
   * 根据用户 ID 获取用户信息
   * @param userId - 用户 ID
   * @returns 用户对象
   * @throws 用户不存在时抛出错误
   */
  async getUserById(userId: number): Promise<User> {
    const result = await db.query<User[]>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (result.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    return result[0];
  }

  /**
   * 更新用户信息
   * @param userId - 用户 ID
   * @param updates - 更新字段
   * @returns 是否更新成功
   */
  async updateUser(
    userId: number,
    updates: Partial<User>
  ): Promise<boolean> {
    const result = await db.query(
      'UPDATE users SET ? WHERE id = ?',
      [updates, userId]
    );
    
    return result.affectedRows > 0;
  }
}

export default UserService;
```

### 示例 2：迁移 auth.js + auth_optimized.js → auth.ts

#### 关键决策：选择哪个版本？

**分析步骤**：
```bash
# 1. 检查两个文件的差异
diff server/routes/auth.js server/routes/auth_optimized.js

# 2. 对比性能测试结果
# - 响应时间
# - 内存使用
# - 代码可读性

# 3. 检查功能差异
# - 是否都实现了全部端点？
# - 有没有缺少的功能？

# 4. 检查错误处理
# - 异常处理是否更全面？
# - 日志记录是否更完善？
```

**假设分析结果**：
- `auth.js`：更易读，功能完整，错误处理详尽
- `auth_optimized.js`：性能稍优，但代码复杂

**决策**：基于 auth.js，融入 auth_optimized.js 的优化

```typescript
// server/routes/auth.ts (合并后的结果)
import { Router, Request, Response } from 'express';
import { User } from '../types/user';
import { LoginResponse, RegisterRequest } from '../types/auth';

const router = Router();

/**
 * 用户注册
 * @route POST /auth/register
 */
router.post(
  '/register',
  async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      // 输入验证
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: '缺少必需字段'
        });
      }

      // 检查用户是否已存在（优化：使用索引查询）
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: '邮箱已被注册'
        });
      }

      // 创建新用户（性能优化：使用 INSERT IGNORE 或检查唯一性）
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const user: User = {
        id: result.insertId,
        username,
        email,
        createdAt: new Date()
      };

      return res.status(201).json({
        success: true,
        message: '注册成功',
        user
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: '注册失败，请稍后重试'
      });
    }
  }
);

export default router;
```

## 四、时间表详细规划

### 第 1 周（Day 1-5）

```
📅 周一
├─ 09:00-10:00: 团队会议 - 讲解迁移计划
├─ 10:00-12:00: 迁移 config/ 中的 3 个文件
│  ├─ environment.js → environment.ts
│  ├─ secrets.js → secrets.ts
│  └─ session-store.js → session-store.ts
├─ 13:00-15:00: 测试 config 迁移
├─ 15:00-17:00: 迁移 middleware/ 中的 3 个文件
│  ├─ auth.js → auth.ts
│  ├─ monitoring.js → monitoring.ts
│  └─ security.js → security.ts
└─ 代码审核和合并

📅 周二
├─ 09:00-11:00: 迁移 database/ 中的基础文件
│  ├─ db.js → db.ts
│  ├─ db-mysql.js → 合并到 db.ts
│  └─ index.js → index.ts
├─ 11:00-12:00: 单元测试 database 层
├─ 13:00-15:00: 迁移 models/
│  ├─ User.js → User.ts (或合并到 user type)
│  └─ VerificationCode.js → VerificationCode.ts
├─ 15:00-17:00: 测试 models 和 database 依赖
└─ 代码审核

📅 周三-四：迁移 services 层（4 个文件）
📅 周五：集成测试和小 bug 修复
```

### 第 2 周（Day 8-10）

```
📅 周一-二：处理最复杂的部分
├─ 分析 auth.js vs auth_optimized.js
│  ├─ 代码对比
│  ├─ 性能测试
│  ├─ 功能检查
│  └─ 决策：保留/合并哪个版本
├─ 分析 earth.js vs earth_optimized.js
│  └─ 同上

📅 周三-四：合并并迁移路由
├─ auth 相关路由 → auth.ts
├─ earth 相关路由 → earth.ts
├─ 完整的 API 测试

📅 周五：最后收尾
├─ 全局类型检查
├─ 集成测试
├─ 移除 .js 文件
└─ 文档更新
```

## 五、验收测试清单

### ✅ 代码质量检查

```bash
# 1. TypeScript 编译
npm run type-check:server
# 预期：零错误、零警告

# 2. ESLint 检查
npm run lint
# 预期：零错误

# 3. 文件格式化
npm run format
git diff --exit-code
# 预期：无差异（已自动格式化）
```

### ✅ 功能测试

```bash
# 启动服务器
npm run server:dev

# 测试所有 API 端点
bash test-auth.js
bash test-earth-hotspots.js
bash test-flower-system.sh
bash test-grave-purchase.sh

# 预期：所有测试通过
```

### ✅ 性能基准测试

```bash
# 记录转换前的性能指标
ab -n 100 -c 10 http://localhost:3000/api/auth/login

# 转换后比较
# 预期：响应时间 < 500ms (p99)
```

### ✅ 覆盖率检查

```bash
npm test -- --coverage

# 预期：行覆盖率 > 80%
```

## 六、风险控制

### 🛑 风险清单

| 风险 | 缓解措施 |
|-----|--------|
| 功能中断 | 在迁移前为每个文件编写单元测试 |
| 性能下降 | 使用基准测试工具，对比编译前后 |
| 类型错误 | 启用 TypeScript 严格模式 `strict: true` |
| 部署失败 | 创建特性分支，使用特性开关 |
| 文档过时 | 自动生成 API 文档，版本控制 |

### 🔄 回滚方案

```bash
# 第 1 步：使用 git tag 标记当前状态
git tag "pre-typescript-migration"

# 第 2 步：如果出问题，快速回滚
git checkout pre-typescript-migration

# 第 3 步：通知团队，分析问题
git log pre-typescript-migration..typescript-migration
```

## 七、自动化工具配置

### 推荐工具

```json
{
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "typescript": "latest",
    "ts-node": "latest",
    "prettier": "latest",
    "husky": "latest",
    "lint-staged": "latest"
  }
}
```

### Pre-commit Hooks

```bash
# 在提交前自动运行检查
.husky/pre-commit:

npm run format:check
npm run lint
npm run type-check:server

# 如果任何检查失败，阻止提交
```

## 八、交付清单

### 迁移完成后

- ✅ 所有 JavaScript 文件转换为 TypeScript
- ✅ 所有重复文件已合并
- ✅ 统一 tsconfig.json 配置
- ✅ 所有测试通过
- ✅ 性能验证完成
- ✅ 文档已更新
- ✅ 团队培训完成
- ✅ CI/CD 流程验证

### 预期文件结构

```
server/
├── config/
│   ├── environment.ts    ✅ 已转换
│   ├── grave-purchase.ts ✅ 已存在
│   ├── secrets.ts        ✅ 已转换
│   └── session-store.ts  ✅ 已转换
├── database/
│   ├── db.ts             ✅ 已转换
│   ├── index.ts          ✅ 已转换
│   ├── migrate-to-mysql.ts ✅ 已转换
│   ├── schema.*.ts       ✅ 已存在
│   └── [不再有 .js]
├── middleware/
│   ├── auth.ts           ✅ 已转换
│   ├── authorization.ts  ✅ 已存在
│   ├── monitoring.ts     ✅ 已转换
│   └── security.ts       ✅ 已转换
├── models/
│   ├── User.ts           ✅ 已转换
│   └── VerificationCode.ts ✅ 已转换
├── routes/
│   ├── auth.ts           ✅ 已合并 (删除 auth.js 和 auth_optimized.js)
│   ├── earth.ts          ✅ 已合并 (删除 earth.js 和 earth_optimized.js)
│   ├── block.ts          ✅ 已存在
│   ├── flowers.ts        ✅ 已存在
│   ├── grave.ts          ✅ 已存在
│   ├── permission.ts     ✅ 已存在
│   ├── privacy.ts        ✅ 已存在
│   └── purchase.ts       ✅ 已存在
├── services/
│   ├── GraveEncryptionService.ts ✅ 已存在
│   ├── GraveFlowerService.ts     ✅ 已存在
│   ├── GravePurchaseService.ts   ✅ 已存在
│   ├── GraveService.ts           ✅ 已存在
│   ├── HotspotService.ts         ✅ 已转换
│   ├── PrivacyService.ts         ✅ 已存在
│   ├── UserService.ts            ✅ 已转换
│   ├── VerificationCodeService.ts ✅ 已转换
│   └── verificationService.ts    ✅ 已转换
├── types/
│   ├── *.ts              ✅ 已存在
│   └── [完整的类型定义]
├── index.ts              ✅ 已转换/已存在
└── tsconfig.json         ✅ 统一配置
```

---

**文档版本**: v1.0  
**最后更新**: 2026年2月28日  
**状态**: 规划阶段，待执行
