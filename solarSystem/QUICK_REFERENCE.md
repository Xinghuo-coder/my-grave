# 墓地购买系统 - 快速参考

## 🚀 快速开始

### 1. 初始化数据库

```bash
# 方式 1: 运行迁移脚本
bash database-migration-purchase.sh

# 方式 2: 在应用启动时自动初始化
# GravePurchaseService.initializeConfig() 会自动创建默认配置
```

### 2. 注册路由（在 server/index.ts）

```typescript
import purchaseRouter from './routes/purchase';
app.use('/api/purchase', purchaseRouter);
```

### 3. 默认配置

```
✓ 每人免费墓地数：1
✓ 额外墓地价格：100 USDT
✓ 购买功能：已启用
```

---

## 📊 核心功能

| 功能 | 说明 | 触发时机 |
|------|------|----------|
| 自动分配免费墓地 | 用户注册时自动获得 1 块 | 用户完成注册 |
| 验证创建权限 | 检查用户是否有可用配额 | 用户创建墓地 |
| 创建购买订单 | 用户支付 USDT 购买额外墓地 | 用户发起购买 |
| 确认购买 | 确认支付后更新用户配额 | 管理员确认订单 |

---

## 🔧 主要文件

```
server/
├── database/
│   └── schema.payment.ts          ← 数据库表定义
├── services/
│   └── GravePurchaseService.ts    ← 核心业务逻辑
├── routes/
│   └── purchase.ts                ← API 路由
├── config/
│   └── grave-purchase.ts          ← 配置管理
└── types/
    └── payment.ts                 ← 类型定义

GRAVE_PURCHASE_SYSTEM.md          ← 完整文档
database-migration-purchase.sh    ← 迁移脚本
QUICK_REFERENCE.md                ← 本文件
```

---

## 📝 API 速查表

### 用户接口

| 方法 | 端点 | 说明 | 身份验证 |
|------|------|------|---------|
| GET | `/api/purchase/config` | 获取配置 | - |
| GET | `/api/purchase/user/quota` | 获取配额 | ✓ |
| POST | `/api/purchase/calculate` | 计算价格 | - |
| POST | `/api/purchase/create-order` | 创建订单 | ✓ |
| GET | `/api/purchase/order/:id` | 查询订单 | ✓ |
| GET | `/api/purchase/history` | 购买历史 | ✓ |

### 管理员接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/purchase/admin/config` | 获取配置 |
| PUT | `/api/purchase/admin/config` | 修改配置 |
| POST | `/api/purchase/confirm-order` | 确认订单 |

---

## 🔄 用户使用流程

```
1. 用户注册
   ↓ (自动)
2. 获得 1 块免费墓地
   ↓
3. 可立即创建 1 个墓地
   ↓
4. 若需要更多墓地，发起购买
   ↓
5. 创建订单 → 支付 USDT → 管理员确认
   ↓
6. 配额更新，可创建更多墓地
```

---

## 💰 配置示例

### 设置每人免费 2 块，价格 50 USDT

```bash
curl -X PUT http://localhost:3000/api/purchase/admin/config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "freeGravesPerUser": 2,
    "usdtPricePerGrave": 50
  }'
```

### 禁用购买功能

```bash
curl -X PUT http://localhost:3000/api/purchase/admin/config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "isEnabled": false }'
```

---

## 🗂️ 数据库表概览

### grave_purchase_config
```
id                    ┆ 配置 ID
free_graves_per_user  ┆ 每人免费墓地数 (默认 1)
usdt_price_per_grave  ┆ 每块额外墓地价格 (默认 100)
currency              ┆ 货币类型 (USDT)
is_enabled            ┆ 是否启用
```

### user_grave_quota
```
id                    ┆ 配额 ID
user_id               ┆ 用户 ID (唯一)
free_graves_allocated ┆ 已分配的免费墓地数
purchased_graves      ┆ 已购买的墓地数
total_graves_limit    ┆ 总限制（可选）
```

### grave_purchase_records
```
id                ┆ 订单 ID
user_id           ┆ 用户 ID
quantity          ┆ 购买数量
usdt_amount       ┆ 支付金额
status            ┆ 订单状态 (pending/processing/confirmed/failed/refunded)
transaction_hash  ┆ 交易哈希
blockchain_network┆ 区块链网络
wallet_address    ┆ 用户钱包
purchase_date     ┆ 购买日期
confirmed_date    ┆ 确认日期
```

### free_grave_allocation_records
```
id          ┆ 记录 ID
user_id     ┆ 用户 ID
grave_id    ┆ 墓地 ID
allocated_at┆ 分配时间
reason      ┆ 原因
```

---

## ⚙️ 环境配置

### 开发环境 (`NODE_ENV=development`)
```
✓ 免费墓地：1
✓ 价格：1 USDT（便宜用于测试）
✓ 自动确认：是
```

### 测试环境 (`NODE_ENV=staging`)
```
✓ 免费墓地：1
✓ 价格：10 USDT
✓ 自动确认：否
```

### 生产环境 (`NODE_ENV=production`)
```
✓ 免费墓地：1
✓ 价格：100 USDT
✓ 自动确认：否
```

---

## 🔐 权限检查清单

- [ ] 用户能创建购买订单（已验证）
- [ ] 用户只能查看自己的订单（已验证）
- [ ] 管理员能修改配置（已验证）
- [ ] 管理员能确认订单（已验证）

---

## 🐛 常见问题排查

### 问题 1: 「用户配额不存在」

**原因**：用户配额表未初始化
**解决**：
```sql
INSERT INTO user_grave_quota (user_id, free_graves_allocated, purchased_graves)
VALUES (?, 1, 0);
```

### 问题 2: 「购买功能未启用」

**原因**：配置中 `is_enabled = false`
**解决**：修改配置或通过 API 启用

### 问题 3: 用户创建超过限制的墓地

**原因**：权限验证未启用
**解决**：确保 `validateCanCreateGrave()` 被正确调用

---

## 📈 SQL 查询示例

### 查看用户配额
```sql
SELECT u.username, q.free_graves_allocated, q.purchased_graves, COUNT(g.id) as grave_count
FROM users u
LEFT JOIN user_grave_quota q ON u.id = q.user_id
LEFT JOIN graves g ON u.id = g.user_id
GROUP BY u.id;
```

### 查看待确认订单
```sql
SELECT * FROM grave_purchase_records WHERE status = 'pending' ORDER BY purchase_date;
```

### 查看用户购买历史
```sql
SELECT * FROM grave_purchase_records WHERE user_id = ? ORDER BY purchase_date DESC;
```

### 统计销售数据
```sql
SELECT 
  COUNT(*) as total_orders,
  SUM(quantity) as total_graves_sold,
  SUM(usdt_amount) as total_revenue
FROM grave_purchase_records
WHERE status = 'confirmed';
```

---

## 📞 技术支持

**需要帮助？**

1. 查看完整文档：`GRAVE_PURCHASE_SYSTEM.md`
2. 检查应用日志：`logs/` 目录
3. 验证数据库连接：确保所有表已创建
4. 测试 API：使用 Postman 或 curl

---

## 🎯 下一步

- [ ] 部署数据库表
- [ ] 注册 API 路由
- [ ] 测试注册流程（验证免费墓地分配）
- [ ] 测试购买流程
- [ ] 更新前端界面（显示配额信息）
- [ ] 配置管理面板（修改 USDT 价格等）

---

**版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: System Team
