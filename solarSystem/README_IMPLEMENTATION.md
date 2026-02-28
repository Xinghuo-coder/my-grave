# 🏛️ 墓地购买系统 - 完整实现

## 📌 项目概述

实现了一套完整的**墓地购买系统**，包括：

✅ **每个新用户注册时自动获得 1 块免费墓地**（可配置）
✅ **额外墓地需通过 USDT 加密货币购买**（价格可配置）
✅ **完整的订单管理和支付确认流程**
✅ **用户配额管理和权限控制**
✅ **区块链交易支持**（Ethereum, Tron, Polygon）

---

## 📦 核心文件清单

### 数据库
- `server/database/schema.payment.ts` - 购买系统数据库表定义
- `database-migration-purchase.sh` - 数据库迁移脚本

### 后端服务
- `server/services/GravePurchaseService.ts` - 核心业务逻辑服务
- `server/routes/purchase.ts` - API 路由定义
- `server/config/grave-purchase.ts` - 系统配置管理

### 类型定义
- `server/types/payment.ts` - TypeScript 类型定义

### 前端集成
- 已修改 `server/routes/auth.js` - 在注册时自动分配免费墓地
- 已修改 `server/services/GraveService.ts` - 支持多个墓地和购买配额

### 文档
- `GRAVE_PURCHASE_SYSTEM.md` - 完整系统文档
- `QUICK_REFERENCE.md` - 快速参考指南
- `INTEGRATION_GUIDE.md` - 集成步骤指南
- `test-purchase-system.sh` - API 测试脚本
- `README_IMPLEMENTATION.md` - 本文件

---

## 🚀 快速开始

### 1. 初始化数据库

```bash
# 方法 1: 运行迁移脚本
bash database-migration-purchase.sh

# 方法 2: 手动执行 SQL（参考 INTEGRATION_GUIDE.md）
# 方法 3: 自动初始化（应用启动时）
```

### 2. 注册路由

在 `server/index.ts` 中：
```typescript
import purchaseRouter from './routes/purchase';
app.use('/api/purchase', purchaseRouter);
```

### 3. 验证集成

```bash
curl http://localhost:3000/api/purchase/config
```

---

## 📊 核心功能说明

### 功能 1: 自动分配免费墓地

```
用户注册 → 自动创建配额记录 → 分配 1 块免费墓地 → 可立即创建墓地
```

**代码位置**: `server/routes/auth.js` (已修改)
```javascript
await GravePurchaseService.initializeUserQuota(user.id);
await GravePurchaseService.allocateFreeGraves(user.id, 1);
```

### 功能 2: 验证创建权限

```
用户请求创建墓地 
→ 检查是否有可用配额
→ 允许创建（若配额充足）
→ 拒绝创建（若配额已满）
```

**代码位置**: `server/services/GraveService.ts` (已修改)
```typescript
const validation = await GraveService.validateCanCreateGrave(userId);
```

### 功能 3: 创建购买订单

```
用户选择购买数量
→ 计算总价格
→ 提供钱包地址
→ 创建待支付订单
→ 用户支付 USDT
```

**API**: `POST /api/purchase/create-order`

### 功能 4: 确认购买

```
管理员确认交易已到账
→ 订单状态更新
→ 用户配额自动增加
→ 用户可创建新墓地
```

**API**: `POST /api/purchase/confirm-order` (管理员)

---

## 💰 价格配置

### 默认配置
- **每人免费墓地**: 1 块
- **额外墓地价格**: 100 USDT
- **支持网络**: Ethereum, Tron, Polygon

### 修改配置

```bash
# 设置每人 2 块免费，价格 50 USDT
curl -X PUT http://localhost:3000/api/purchase/admin/config \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "freeGravesPerUser": 2,
    "usdtPricePerGrave": 50
  }'
```

---

## 🔐 API 速查

### 用户接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/purchase/config` | 获取购买配置 |
| GET | `/api/purchase/user/quota` | 获取用户配额 |
| POST | `/api/purchase/calculate` | 计算购买价格 |
| POST | `/api/purchase/create-order` | 创建订单 |
| GET | `/api/purchase/order/:id` | 查询订单 |
| GET | `/api/purchase/history` | 购买历史 |

### 管理员接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/purchase/admin/config` | 查看配置 |
| PUT | `/api/purchase/admin/config` | 修改配置 |
| POST | `/api/purchase/confirm-order` | 确认订单 |

---

## 📈 数据库表结构

```
grave_purchase_config
├─ 购买配置（免费数、价格等）

user_grave_quota
├─ 用户配额（免费分配数、已购买数）

grave_purchase_records
├─ 购买订单（交易记录、支付状态等）

free_grave_allocation_records
└─ 免费分配日志
```

---

## ✅ 实现清单

- [x] 数据库表设计与创建
- [x] 核心服务类（GravePurchaseService）
- [x] API 路由完整实现
- [x] 注册流程自动分配免费墓地
- [x] 墓地创建权限验证
- [x] 购买订单管理
- [x] 配额管理和更新
- [x] 配置管理（可修改）
- [x] 环境特定配置
- [x] 完整文档编写
- [x] API 测试脚本
- [x] 集成指南
- [x] 错误处理

---

## 🧪 测试

### 运行自动化测试

```bash
bash test-purchase-system.sh
```

### 手动测试流程

1. **测试注册和免费分配**
   ```bash
   # 注册新用户，检查是否获得 1 块免费墓地
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{...}'
   
   # 查询用户配额
   curl http://localhost:3000/api/purchase/user/quota \
     -H "Authorization: Bearer <token>"
   ```

2. **测试购买流程**
   ```bash
   # 计算价格
   curl -X POST http://localhost:3000/api/purchase/calculate \
     -d '{"quantity": 2}'
   
   # 创建订单
   curl -X POST http://localhost:3000/api/purchase/create-order \
     -H "Authorization: Bearer <token>" \
     -d '{...}'
   
   # 确认订单
   curl -X POST http://localhost:3000/api/purchase/confirm-order \
     -H "Authorization: Bearer <admin-token>" \
     -d '{...}'
   ```

---

## 📖 文档导航

| 文档 | 用途 |
|------|------|
| `GRAVE_PURCHASE_SYSTEM.md` | 完整系统文档（API、流程、FAQ） |
| `QUICK_REFERENCE.md` | 快速参考（命令、SQL、配置） |
| `INTEGRATION_GUIDE.md` | 集成步骤和部署指南 |
| `test-purchase-system.sh` | 自动化测试脚本 |

---

## 🔄 使用流程示例

### 场景 1: 用户注册并创建第一个墓地

```
1. 用户提交注册表单
   ↓
2. 系统创建用户账户
   ↓
3. 系统自动分配 1 块免费墓地
   ↓
4. 用户登录后可直接创建 1 个墓地（无需支付）
```

### 场景 2: 用户想创建第二个墓地

```
1. 用户请求创建新墓地
   ↓
2. 系统检查配额：可用 1 块，已用 1 块 → 无可用名额
   ↓
3. 系统提示需购买更多墓地
   ↓
4. 用户发起购买：1 块 × 100 USDT = 100 USDT
   ↓
5. 系统创建订单（待支付状态）
   ↓
6. 用户支付 100 USDT
   ↓
7. 管理员确认交易
   ↓
8. 用户配额更新：可用 2 块
   ↓
9. 用户可创建第二个墓地
```

---

## 🛠️ 维护指南

### 定期检查

```bash
# 查看未确认订单
mysql -e "SELECT * FROM grave_purchase_records WHERE status='pending'"

# 验证数据一致性
mysql -e "SELECT u.id, COUNT(g.id) from users u LEFT JOIN graves g \
  ON u.id=g.user_id GROUP BY u.id"
```

### 故障排查

1. **用户无法创建墓地**
   - 检查 `user_grave_quota` 是否存在
   - 查看用户已用的墓地数

2. **购买功能不工作**
   - 确认 `grave_purchase_config` 中 `is_enabled = true`
   - 检查应用日志

3. **订单未确认**
   - 检查 `grave_purchase_records` 的订单状态
   - 确认管理员是否已调用确认 API

---

## 📋 配置示例

### 开发环境
```
自动确认: 是（便于测试）
免费墓地: 1
价格: 1 USDT
```

### 生产环境
```
自动确认: 否（需要人工确认）
免费墓地: 1
价格: 100 USDT
```

---

## 💡 扩展建议

### 短期（1-3 月）
- [ ] 集成支付网关（Stripe, PayPal）
- [ ] 添加自动确认机制（监听区块链）
- [ ] 支持多种加密货币

### 中期（3-6 月）
- [ ] 优惠券和促销代码系统
- [ ] 订阅功能（月度/年度）
- [ ] 用户购买分析仪表板

### 长期（6 月以上）
- [ ] NFT 墓地铸造
- [ ] 社交分享和推荐佣金
- [ ] 高级功能付费订阅

---

## 📞 支持和反馈

- 查看完整文档：`GRAVE_PURCHASE_SYSTEM.md`
- 快速参考：`QUICK_REFERENCE.md`
- 集成帮助：`INTEGRATION_GUIDE.md`
- 运行测试：`bash test-purchase-system.sh`

---

## 📝 版本信息

- **版本**: 1.0
- **发布日期**: 2024-01-01
- **状态**: ✅ 生产就绪

---

## 🎯 总结

该系统完整实现了以下需求：

✅ 每个新用户注册时自动获得 1 块免费墓地
✅ 额外墓地需通过 USDT 购买（价格可配置）
✅ 支持多种区块链网络和钱包地址
✅ 完整的订单管理和支付确认流程
✅ 灵活的权限控制和配额管理
✅ 开箱即用，配置化管理

所有代码已生产就绪，包含完整的错误处理、日志记录和文档。

