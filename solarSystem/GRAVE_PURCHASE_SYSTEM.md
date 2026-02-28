# 墓地购买系统实现文档

## 概述

该系统实现了以下功能：
- **每个新用户注册时自动获得 1 块免费墓地**（可配置）
- **额外墓地需通过 USDT 购买**（价格可配置，默认 100 USDT/块）
- **完整的购买流程管理**（订单创建、支付确认、配额管理）

## 系统架构

### 核心组件

#### 1. **数据库表** (`server/database/schema.payment.ts`)
- `grave_purchase_config` - 购买配置（免费数量、USDT 价格）
- `user_grave_quota` - 用户配额（免费分配数、已购买数）
- `grave_purchase_records` - 购买交易记录
- `free_grave_allocation_records` - 免费墓地分配日志

#### 2. **核心服务** (`server/services/GravePurchaseService.ts`)
主要功能：
- 配置管理（获取、更新默认配置）
- 用户配额初始化和管理
- 购买订单创建和确认
- 价格计算
- 权限验证

#### 3. **API 路由** (`server/routes/purchase.ts`)
用户接口：
- `GET /api/purchase/config` - 获取配置
- `GET /api/purchase/user/quota` - 获取用户配额
- `POST /api/purchase/calculate` - 计算价格
- `POST /api/purchase/create-order` - 创建订单
- `GET /api/purchase/order/:id` - 查询订单
- `GET /api/purchase/history` - 购买历史

管理员接口：
- `PUT /api/purchase/admin/config` - 更新配置

#### 4. **配置管理** (`server/config/grave-purchase.ts`)
支持环境特定配置：
- 开发环境：自动确认、价格 1 USDT（用于测试）
- 测试环境：价格 10 USDT
- 生产环境：价格 100 USDT

#### 5. **类型定义** (`server/types/payment.ts`)
包含所有 TypeScript 类型定义

---

## 使用流程

### 用户注册流程

```
1. 用户提交注册表单
   ↓
2. auth.js 验证邮箱和其他字段
   ↓
3. 创建用户账户
   ↓
4. 自动调用 GravePurchaseService.initializeUserQuota()
   ↓
5. 为用户分配 1 块免费墓地
   ↓
6. 记录免费分配日志
   ↓
7. 注册完成，用户可立即创建 1 个墓地
```

### 创建墓地流程

```
1. 用户请求创建墓地
   ↓
2. 调用 GraveService.validateCanCreateGrave()
   ↓
3. 验证用户是否有可用配额：
   - 计算已用墓地数
   - 获取可用配额（免费 + 已购买）
   - 检查是否还有剩余名额
   ↓
4. 验证通过 → 创建墓地
   验证失败 → 提示需要购买更多墓地
```

### 购买墓地流程

```
1. 用户请求购买
   ↓
2. POST /api/purchase/calculate
   → 返回价格信息（数量、单价、总价）
   ↓
3. 用户确认购买
   POST /api/purchase/create-order
   → 创建待支付订单
   ↓
4. 用户在钱包中支付 USDT
   ↓
5. 系统接收到区块链确认（由外部系统触发）
   POST /api/purchase/confirm-order (管理员)
   ↓
6. 订单状态更新为 'confirmed'
   用户配额自动更新
   ↓
7. 用户可创建新的墓地
```

---

## API 详细文档

### 1. 获取购买配置

```http
GET /api/purchase/config
```

**响应**：
```json
{
  "success": true,
  "data": {
    "freeGravesPerUser": 1,
    "usdtPricePerGrave": 100,
    "currency": "USDT",
    "isEnabled": true
  }
}
```

---

### 2. 获取用户配额

```http
GET /api/purchase/user/quota
Authorization: Bearer <token>
```

**响应**：
```json
{
  "success": true,
  "data": {
    "freeGravesAllocated": 1,
    "purchasedGraves": 2,
    "totalAvailableSlots": 3,
    "usedSlots": 1,
    "remainingSlots": 2,
    "canCreateMore": true
  }
}
```

说明：
- `freeGravesAllocated` - 分配的免费墓地数
- `purchasedGraves` - 已购买的墓地数
- `usedSlots` - 已创建的墓地数
- `remainingSlots` - 还可创建的墓地数

---

### 3. 计算购买价格

```http
POST /api/purchase/calculate
Content-Type: application/json

{
  "quantity": 2
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "quantity": 2,
    "unitPrice": 100,
    "totalPrice": 200
  }
}
```

---

### 4. 创建购买订单

```http
POST /api/purchase/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 2,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc255e4512c67f",
  "blockchainNetwork": "Ethereum"
}
```

**响应**：
```json
{
  "success": true,
  "status": 201,
  "message": "订单创建成功，等待支付确认",
  "data": {
    "orderId": 1,
    "quantity": 2,
    "usdtAmount": 200,
    "status": "pending",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc255e4512c67f",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

---

### 5. 查询订单详情

```http
GET /api/purchase/order/1
Authorization: Bearer <token>
```

**响应**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "quantity": 2,
    "usdtAmount": 200,
    "status": "pending",
    "transactionHash": null,
    "blockchainNetwork": "Ethereum",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc255e4512c67f",
    "purchaseDate": "2024-01-01T12:00:00Z",
    "confirmedDate": null,
    "remarks": null
  }
}
```

---

### 6. 获取购买历史

```http
GET /api/purchase/history?limit=50
Authorization: Bearer <token>
```

**响应**：
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1,
        "quantity": 2,
        "usdtAmount": 200,
        "status": "confirmed",
        "purchaseDate": "2024-01-01T12:00:00Z",
        "confirmedDate": "2024-01-01T12:30:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### 7. 确认购买订单（管理员）

```http
POST /api/purchase/confirm-order
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "orderId": 1,
  "transactionHash": "0x1234567890abcdef..."
}
```

**响应**：
```json
{
  "success": true,
  "message": "订单已确认，用户配额已更新"
}
```

---

### 8. 更新购买配置（管理员）

```http
PUT /api/purchase/admin/config
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "freeGravesPerUser": 2,
  "usdtPricePerGrave": 150,
  "isEnabled": true
}
```

**响应**：
```json
{
  "success": true,
  "message": "配置已更新",
  "data": {
    "id": 1,
    "freeGravesPerUser": 2,
    "usdtPricePerGrave": 150,
    "currency": "USDT",
    "isEnabled": true,
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

---

## 订单状态说明

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `pending` | 待支付 | processing, failed |
| `processing` | 支付处理中 | confirmed, failed |
| `confirmed` | 已确认，配额已更新 | - |
| `failed` | 支付失败 | - |
| `refunded` | 已退款 | - |

---

## 权限控制

### 用户权限
- ✅ 查看配置
- ✅ 查看自己的配额
- ✅ 计算价格
- ✅ 创建订单
- ✅ 查看自己的订单
- ✅ 查看购买历史

### 管理员权限
- ✅ 所有用户权限
- ✅ 查看所有配置
- ✅ 修改配置
- ✅ 确认订单
- ✅ 查看所有购买记录

---

## 配置修改示例

### 示例 1: 修改为每人 2 块免费墓地，价格 50 USDT

```bash
curl -X PUT http://localhost:3000/api/purchase/admin/config \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "freeGravesPerUser": 2,
    "usdtPricePerGrave": 50,
    "isEnabled": true
  }'
```

### 示例 2: 临时禁用购买功能

```bash
curl -X PUT http://localhost:3000/api/purchase/admin/config \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isEnabled": false
  }'
```

### 示例 3: 价格调整为 200 USDT

```bash
curl -X PUT http://localhost:3000/api/purchase/admin/config \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "usdtPricePerGrave": 200
  }'
```

---

## 数据库初始化

### 方式 1: 运行迁移脚本

```bash
bash database-migration-purchase.sh
```

### 方式 2: 手动导入 SQL

```bash
mysql -u root -p solar_system < migration.sql
```

### 方式 3: 应用启动时自动初始化

服务启动时会自动调用 `GravePurchaseService.initializeConfig()`：

```typescript
// server/index.ts 或类似的启动文件
const config = await GravePurchaseService.initializeConfig();
console.log('购买系统配置已初始化');
```

---

## 错误处理

### 常见错误及解决方案

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 「您已达到可拥有的最大墓地数」| 用户已用完配额 | 用户需要购买更多墓地 |
| 「购买功能未启用」| 购买功能被禁用 | 管理员启用购买功能 |
| 「钱包地址无效」| 地址格式不对 | 确保地址格式正确（如 Ethereum: 0x... 或 Tron: T...) |
| 「购买数量必须大于 0」| 数量输入错误 | 输入正确的正整数 |

---

## 集成指南

### 1. 在应用启动时初始化

```typescript
// server/index.ts
import { GravePurchaseService } from './services/GravePurchaseService';

async function initializeApp() {
  try {
    // 初始化购买系统配置
    await GravePurchaseService.initializeConfig();
    console.log('✅ 墓地购买系统已初始化');
  } catch (error) {
    console.error('❌ 初始化购买系统失败:', error);
  }
}

initializeApp();
```

### 2. 注册购买路由

```typescript
// server/index.ts
import purchaseRouter from './routes/purchase';

app.use('/api/purchase', purchaseRouter);
```

### 3. 前端集成

```javascript
// 获取用户配额
async function loadUserQuota() {
  const response = await fetch('/api/purchase/user/quota', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.data;
}

// 创建购买订单
async function createPurchaseOrder(quantity, walletAddress, network) {
  const response = await fetch('/api/purchase/create-order', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quantity,
      walletAddress,
      blockchainNetwork: network
    })
  });
  return await response.json();
}
```

---

## 扩展功能

### 可选的扩展

1. **支持多种加密货币**
   - 在 `grave_purchase_records` 添加 `cryptocurrency_type` 字段
   - 支持 ETH、BNB、TRX 等直接支付

2. **自动化确认机制**
   - 集成区块链事件监听
   - 自动检测交易确认

3. **促销和优惠券**
   - 添加 `coupon_codes` 表
   - 支持折扣码

4. **订阅系统**
   - 月度或年度订阅
   - 自动续费

5. **支付网关集成**
   - Stripe、PayPal 等支付网关
   - 简化支付流程

---

## 常见问题 (FAQ)

**Q: 如何为现有用户分配免费墓地？**

A: 使用以下 SQL：
```sql
-- 为所有尚未初始化配额的用户分配
INSERT INTO user_grave_quota (user_id, free_graves_allocated, purchased_graves)
SELECT id, 1, 0 FROM users 
WHERE id NOT IN (SELECT user_id FROM user_grave_quota);

-- 记录分配日志
INSERT INTO free_grave_allocation_records (user_id, reason)
SELECT id, 'manual_allocation' FROM users 
WHERE id NOT IN (SELECT user_id FROM free_grave_allocation_records);
```

**Q: 如何处理退款？**

A: 通过 API 或数据库更新订单状态：
```typescript
await GravePurchaseService.updatePurchaseRecordStatus(orderId, 'refunded');

// 扣除用户配额
await database.query(
  'UPDATE user_grave_quota SET purchased_graves = purchased_graves - ? WHERE user_id = ?',
  [recordQuantity, userId]
);
```

**Q: 支持哪些区块链网络？**

A: 默认支持：
- Ethereum
- Tron
- Polygon

可在 `grave-purchase.ts` 中修改 `supportedNetworks` 配置。

---

## 性能优化建议

1. **缓存配置**：配置变化不频繁，可缓存在内存中
2. **异步处理**：订单确认、通知等可异步处理
3. **数据库索引**：确保 `user_id`, `status`, `purchase_date` 等字段有索引
4. **分页查询**：购买历史等列表操作应分页

---

## 后续维护

定期检查：
- 未确认订单（超过 24 小时自动失败）
- 重复支付记录
- 配额与墓地数的一致性

```sql
-- 检查数据一致性
SELECT u.id, u.username, q.free_graves_allocated, q.purchased_graves, COUNT(g.id) as grave_count
FROM users u
LEFT JOIN user_grave_quota q ON u.id = q.user_id
LEFT JOIN graves g ON u.id = g.user_id
GROUP BY u.id
HAVING COUNT(g.id) > (COALESCE(q.free_graves_allocated, 0) + COALESCE(q.purchased_graves, 0));
```

---

## 技术支持

如有问题，请检查：
1. 数据库表是否已创建
2. 路由是否已注册
3. 中间件权限配置
4. 环境变量配置
5. 应用日志文件

