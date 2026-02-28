# 🌹 墓地鲜花系统 - 完整实现指南

## 概述

墓地鲜花系统允许用户在浏览其他用户的墓地时进行以下互动：

### 功能模块

| 功能 | 成本 | 描述 |
|------|------|------|
| 🌹 赠送鲜花 | **USDT付费** | 用户可购买不同类型鲜花赠送给墓地，支持留言 |
| 💬 发表评论 | **免费** | 用户可以在墓地留下评论（支持匿名） |
| 👍 点赞墓地 | **免费** | 用户可以点赞墓地，表示尊敬或喜爱 |
| 👍 评论点赞 | **免费** | 用户可以对评论进行点赞 |

---

## 数据库设计

### 1. 鲜花配置表 (`grave_flower_config`)

存储可用的鲜花类型及其 USDT 定价。

```sql
CREATE TABLE grave_flower_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flower_type VARCHAR(50) UNIQUE NOT NULL,      -- 玫瑰、百合等
  flower_name VARCHAR(100) NOT NULL,            -- 中文名称
  flower_emoji VARCHAR(10),                    -- 表情符号 🌹
  usdt_price DECIMAL(10, 2) NOT NULL,          -- 单个鲜花价格
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  daily_limit INT,                             -- 可选的日购买限制
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**预设鲜花类型：**
- `rose` - 玫瑰花 (🌹) - 1 USDT
- `lily` - 百合花 (🌸) - 2 USDT
- `chrysanthemum` - 菊花 (🌼) - 1 USDT
- `sunflower` - 向日葵 (🌻) - 1.5 USDT
- `tulip` - 郁金香 (🌷) - 2 USDT

### 2. 用户鲜花购买记录表 (`user_flower_purchases`)

记录用户的USDT花费历史。

```sql
CREATE TABLE user_flower_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  flower_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  usdt_amount DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flower_type) REFERENCES grave_flower_config(flower_type)
);
```

### 3. 墓地鲜花赠送记录表 (`grave_flower_donations`)

记录向各墓地赠送的鲜花。

```sql
CREATE TABLE grave_flower_donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grave_id INT NOT NULL,
  user_id INT,                           -- 可为空（匿名赠送）
  flower_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  message TEXT,                          -- 留言信息
  donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### 4. 墓地点赞表 (`grave_likes`)

**免费功能** - 记录用户对墓地的点赞。

```sql
CREATE TABLE grave_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grave_id INT NOT NULL,
  user_id INT,                           -- 可为空（匿名点赞）
  ip_address VARCHAR(45),                -- 匿名用户的IP
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_like (user_id, grave_id),  -- 防止重复点赞
  UNIQUE KEY unique_ip_like (ip_address, grave_id),
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE
);
```

**重要特性：**
- `UNIQUE KEY unique_user_like (user_id, grave_id)` - 同一用户不能对同一墓地点赞多次
- `UNIQUE KEY unique_ip_like (ip_address, grave_id)` - 同一IP不能对同一墓地点赞多次

### 5. 墓地评论表 (`grave_comments`)

**免费功能** - 用户评论。

```sql
CREATE TABLE grave_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grave_id INT NOT NULL,
  user_id INT,                           -- 可为空（匿名评论）
  comment_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  likes_count INT DEFAULT 0,             -- 评论获赞数（冗余字段用于快速查询）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE
);
```

### 6. 评论点赞表 (`comment_likes`)

**免费功能** - 对评论的点赞。

```sql
CREATE TABLE comment_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL,
  user_id INT,
  ip_address VARCHAR(45),
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_comment_like (user_id, comment_id),
  UNIQUE KEY unique_ip_comment_like (ip_address, comment_id),
  FOREIGN KEY (comment_id) REFERENCES grave_comments(id) ON DELETE CASCADE
);
```

---

## API 端点

### 鲜花管理

#### 1. 获取鲜花配置
```http
GET /api/flowers/config
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "flowerType": "rose",
      "flowerName": "玫瑰花",
      "flowerEmoji": "🌹",
      "usdtPrice": 1,
      "description": "象征爱与热情",
      "isAvailable": true
    }
  ]
}
```

#### 2. 获取墓地的鲜花记录
```http
GET /api/flowers/graves/{graveId}/flowers?limit=50
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "flowers": [
      {
        "id": 1,
        "graveId": 123,
        "userId": 456,
        "flowerType": "rose",
        "quantity": 5,
        "message": "永远怀念",
        "donatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "stats": {
      "rose": 10,
      "lily": 3,
      "chrysanthemum": 5
    },
    "total": 18
  }
}
```

#### 3. 赠送鲜花（支付）
```http
POST /api/flowers/graves/{graveId}/flowers/send
Content-Type: application/json
Cookie: [session_id]

{
  "flowerType": "rose",
  "quantity": 5,
  "message": "永远怀念你"
}
```

**需要认证：** ✅ 是

**响应示例：**
```json
{
  "success": true,
  "message": "赠送鲜花需要支付，请完成支付",
  "data": {
    "orderId": 999,
    "flowerType": "rose",
    "quantity": 5,
    "totalUSDT": 5,
    "walletAddress": "0x...",
    "networkName": "ethereum"
  }
}
```

**流程说明：**
1. 用户提交赠送请求
2. 系统创建待支付订单（使用现有的 GravePurchaseService）
3. 用户确认支付后调用 `/confirm` 端点完成赠送

#### 4. 确认鲜花支付
```http
POST /api/flowers/graves/{graveId}/flowers/confirm
Content-Type: application/json
Cookie: [session_id]

{
  "orderId": 999,
  "message": "永远怀念你"
}
```

**需要认证：** ✅ 是

**前置条件：** 订单状态必须为 `confirmed`

---

### 点赞系统

#### 1. 获取墓地点赞数
```http
GET /api/flowers/graves/{graveId}/likes
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "likesCount": 42,
    "hasLiked": true
  }
}
```

#### 2. 点赞墓地
```http
POST /api/flowers/graves/{graveId}/like
```

**需要认证：** ❌ 否（支持匿名）

**响应示例：**
```json
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "likesCount": 43
  }
}
```

**错误情况：**
- 如果用户已点赞 → HTTP 400: "您已经点赞过这个墓地"

#### 3. 取消点赞
```http
DELETE /api/flowers/graves/{graveId}/like
```

**响应示例：**
```json
{
  "success": true,
  "message": "取消点赞成功",
  "data": {
    "likesCount": 42
  }
}
```

---

### 评论系统

#### 1. 发表评论
```http
POST /api/flowers/graves/{graveId}/comments
Content-Type: application/json

{
  "commentText": "安息吧，你将永远被铭记",
  "isAnonymous": true
}
```

**需要认证：** ❌ 否（可匿名）

**验证规则：**
- `commentText` 长度: 1-500 字
- 不支持空评论

**响应示例：**
```json
{
  "success": true,
  "message": "评论成功",
  "data": {
    "id": 1,
    "graveId": 123,
    "userId": null,
    "commentText": "安息吧",
    "isAnonymous": true,
    "likesCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. 获取评论列表
```http
GET /api/flowers/graves/{graveId}/comments?page=1&limit=20
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "graveId": 123,
        "userId": null,
        "commentText": "安息吧",
        "isAnonymous": true,
        "likesCount": 5,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 42
  }
}
```

#### 3. 删除评论
```http
DELETE /api/comments/{commentId}
Cookie: [session_id]
```

**需要认证：** ✅ 是

**权限：** 仅评论作者或管理员可删除

**响应示例：**
```json
{
  "success": true,
  "message": "评论删除成功"
}
```

---

### 评论点赞

#### 1. 点赞评论
```http
POST /api/comments/{commentId}/like
```

**需要认证：** ❌ 否

**响应示例：**
```json
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "likesCount": 6
  }
}
```

#### 2. 取消点赞评论
```http
DELETE /api/comments/{commentId}/like
```

**响应示例：**
```json
{
  "success": true,
  "message": "取消点赞成功",
  "data": {
    "likesCount": 5
  }
}
```

---

### 管理员功能

#### 1. 更新鲜花配置
```http
PUT /api/flowers/admin/config
Content-Type: application/json
Cookie: [admin_session_id]

{
  "flowerType": "rose",
  "flowerName": "红玫瑰",
  "usdtPrice": 1.5,
  "isAvailable": true,
  "dailyLimit": 100
}
```

**需要认证：** ✅ 是（仅管理员）

**权限：** 仅管理员可访问

**响应示例：**
```json
{
  "success": true,
  "message": "配置更新成功",
  "data": {
    "flowerType": "rose",
    "flowerName": "红玫瑰",
    "usdtPrice": 1.5,
    "isAvailable": true
  }
}
```

---

## 服务类：GraveFlowerService

### 核心方法

#### 配置管理
```typescript
// 初始化默认鲜花配置
static async initializeFlowerConfig(): Promise<FlowerConfig[]>

// 获取所有可用鲜花
static async getAllFlowerConfigs(): Promise<FlowerConfig[]>

// 获取单个鲜花配置
static async getFlowerConfig(flowerType: string): Promise<FlowerConfig | null>

// 计算购买成本
static async calculateFlowerCost(flowerType: string, quantity: number): Promise<number | null>
```

#### 购买和赠送
```typescript
// 记录鲜花购买
static async recordFlowerPurchase(userId: number, flowerType: string, quantity: number, usdtAmount: number): Promise<boolean>

// 赠送鲜花到墓地
static async donateFlower(graveId: number, flowerType: string, quantity: number, userId?: number, message?: string): Promise<FlowerDonation>

// 获取墓地的鲜花
static async getGraveFlowers(graveId: number, limit: number = 50): Promise<FlowerDonation[]>

// 获取墓地的鲜花统计
static async getGraveFlowerStats(graveId: number): Promise<Record<string, number>>

// 获取墓地总鲜花数
static async getGraveTotalFlowers(graveId: number): Promise<number>
```

#### 点赞系统
```typescript
// 点赞墓地
static async likeGrave(graveId: number, userId?: number, ipAddress?: string): Promise<boolean>

// 取消点赞
static async unlikeGrave(graveId: number, userId?: number, ipAddress?: string): Promise<boolean>

// 获取点赞数
static async getGraveLikesCount(graveId: number): Promise<number>

// 检查用户是否已点赞
static async hasUserLikedGrave(graveId: number, userId?: number, ipAddress?: string): Promise<boolean>
```

#### 评论系统
```typescript
// 发表评论
static async addComment(graveId: number, commentText: string, userId?: number, isAnonymous?: boolean): Promise<GraveComment>

// 获取评论列表（分页）
static async getGraveComments(graveId: number, page?: number, limit?: number): Promise<{ comments: GraveComment[]; total: number }>

// 删除评论
static async deleteComment(commentId: number, userId?: number): Promise<boolean>
```

#### 评论点赞
```typescript
// 点赞评论
static async likeComment(commentId: number, userId?: number, ipAddress?: string): Promise<boolean>

// 取消点赞评论
static async unlikeComment(commentId: number, userId?: number, ipAddress?: string): Promise<boolean>

// 获取评论点赞数
static async getCommentLikesCount(commentId: number): Promise<number>

// 检查是否已点赞评论
static async hasUserLikedComment(commentId: number, userId?: number, ipAddress?: string): Promise<boolean>
```

---

## 安装和部署

### 1. 数据库迁移

```bash
# 运行迁移脚本
bash database-migration-flowers.sh
```

此脚本会：
1. 读取 `.env` 文件中的数据库配置
2. 创建所有 6 个相关表
3. 建立适当的外键关系和唯一约束

### 2. 应用集成

已在以下文件中进行集成：

- ✅ **server/index.ts** - 注册鲜花路由
- ✅ **server/routes/auth.js** - 首次注册时初始化鲜花配置

### 3. 验证安装

```bash
# 运行测试脚本
bash test-flower-system.sh
```

---

## 技术亮点

### 1. 支持匿名用户
- `user_id` 列设置为可为空（NULL）
- 使用 `ip_address` 追踪匿名用户
- 防止同一IP的重复操作

### 2. 防止重复操作
```sql
UNIQUE KEY unique_user_like (user_id, grave_id)     -- 同用户不能重复点赞
UNIQUE KEY unique_ip_like (ip_address, grave_id)    -- 同IP不能重复点赞
```

### 3. 货币化设计
| 操作 | 成本 | 货币化 |
|-----|------|--------|
| 鲜花赠送 | USDT | ✅ 是 |
| 评论 | 免费 | ❌ 否 |
| 墓地点赞 | 免费 | ❌ 否 |
| 评论点赞 | 免费 | ❌ 否 |

### 4. 与现有系统集成
- 使用现有的 `GravePurchaseService` 处理 USDT 支付
- 复用现有的订单系统（status: pending/confirmed/failed）
- 保持一致的错误处理和响应格式

### 5. 完整的审计追踪
- 所有操作都有 `created_at` / `updated_at` 时间戳
- `grave_flower_donations` 表记录所有赠送历史
- `user_flower_purchases` 表记录所有购买历史

---

## 前端集成示例

### 1. 获取和显示鲜花
```javascript
// 获取鲜花配置
async function getFlowerConfig() {
  const response = await fetch('/api/flowers/config');
  const { data } = await response.json();
  return data;  // 返回可用鲜花列表
}

// 获取墓地的鲜花
async function getGraveFlowers(graveId) {
  const response = await fetch(`/api/flowers/graves/${graveId}/flowers`);
  const { data } = await response.json();
  return data;  // { flowers, stats, total }
}
```

### 2. 赠送鲜花
```javascript
// 第1步：创建订单
async function createFlowerOrder(graveId, flowerType, quantity) {
  const response = await fetch(`/api/flowers/graves/${graveId}/flowers/send`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flowerType, quantity })
  });
  return await response.json();
}

// 第2步：用户完成支付后，确认赠送
async function confirmFlowerDonation(graveId, orderId, message) {
  const response = await fetch(`/api/flowers/graves/${graveId}/flowers/confirm`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, message })
  });
  return await response.json();
}
```

### 3. 点赞和评论
```javascript
// 点赞墓地
async function likeGrave(graveId) {
  const response = await fetch(`/api/flowers/graves/${graveId}/like`, {
    method: 'POST',
    credentials: 'include'
  });
  return await response.json();
}

// 发表评论
async function addComment(graveId, commentText) {
  const response = await fetch(`/api/flowers/graves/${graveId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentText, isAnonymous: true })
  });
  return await response.json();
}

// 获取评论
async function getComments(graveId, page = 1) {
  const response = await fetch(`/api/flowers/graves/${graveId}/comments?page=${page}&limit=20`);
  return await response.json();
}
```

---

## 配置说明

鲜花系统配置存储在数据库 `grave_flower_config` 表中。

### 默认配置

系统首次运行时会自动初始化以下鲜花类型：

| 鲜花 | 价格 | 表情 | 描述 |
|-----|------|------|------|
| 玫瑰 | 1 USDT | 🌹 | 象征爱与热情 |
| 百合 | 2 USDT | 🌸 | 象征纯洁与高雅 |
| 菊花 | 1 USDT | 🌼 | 传统的祭奠之花 |
| 向日葵 | 1.5 USDT | 🌻 | 象征永恒的祝福 |
| 郁金香 | 2 USDT | 🌷 | 优雅而高贵 |

### 修改配置

管理员可以通过 API 修改鲜花配置：

```bash
curl -X PUT http://localhost:3000/api/flowers/admin/config \
  -H "Content-Type: application/json" \
  -d '{
    "flowerType": "rose",
    "usdtPrice": 1.5,
    "isAvailable": true
  }' \
  --cookie "session_id=xxx"
```

---

## 故障排除

### 问题：数据库迁移失败

**原因：** 数据库连接配置错误

**解决方案：**
```bash
# 检查 .env 文件
cat .env | grep DB_

# 手动执行迁移
mysql -h localhost -u root -p your_password your_database < migrations.sql
```

### 问题：鲜花赠送后无法确认

**原因：** 订单状态不是 `confirmed`

**解决方案：**
1. 检查订单ID是否正确
2. 确保支付已确认（使用现有的 `GET /api/purchase/order/:id` 检查）

### 问题：无法删除评论

**原因：** 权限不足或不是评论作者

**解决方案：**
- 确保已登录且是评论作者
- 管理员可以删除任何评论

---

## 性能优化建议

### 1. 数据库索引
已创建的索引：
- `idx_is_available` - 鲜花配置查询
- `idx_user_id` - 用户相关查询
- `idx_grave_id` - 墓地相关查询
- `idx_created_at` - 时间排序查询

### 2. 缓存策略
建议缓存：
- 鲜花配置（`grave_flower_config`）- 24小时TTL
- 墓地的鲜花统计 - 1小时TTL

### 3. 分页
- 默认每页20条评论
- 鲜花列表默认50条
- 可通过查询参数自定义

---

## 许可证和协议

此实现遵循既有的项目许可证。

---

## 支持和反馈

有任何问题或建议，请提交问题或联系开发团队。

🌹 感谢使用墓地鲜花系统！
