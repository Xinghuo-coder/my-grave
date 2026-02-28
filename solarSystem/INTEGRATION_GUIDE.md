# 墓地购买系统集成指南

## 📋 集成前准备清单

- [ ] Node.js 和 MySQL 已安装
- [ ] 项目 Git 仓库已初始化
- [ ] 数据库已创建
- [ ] 依赖包已安装

---

## 🔧 逐步集成步骤

### 第 1 步：创建数据库表

#### 方法 A: 运行迁移脚本（推荐）

```bash
# 设置数据库连接信息
export DB_HOST=localhost
export DB_USER=root
export DB_PASS=your_password
export DB_NAME=solar_system

# 运行迁移脚本
bash database-migration-purchase.sh
```

#### 方法 B: 手动执行 SQL

```bash
mysql -h localhost -u root -p solar_system < migration.sql
```

#### 方法 C: 在应用启动时自动初始化

这是最推荐的方法，无需手动操作：

```typescript
// server/index.ts
import { GravePurchaseService } from './services/GravePurchaseService';

async function initializeApp() {
  try {
    // 自动初始化配置和表
    const config = await GravePurchaseService.initializeConfig();
    console.log('✅ 购买系统已初始化，配置:', config);
  } catch (error) {
    console.error('❌ 购买系统初始化失败:', error);
  }
}

initializeApp();
```

---

### 第 2 步：注册购买系统路由

在 `server/index.ts` 或 `server/app.ts` 中：

```typescript
import purchaseRouter from './routes/purchase';

// 注册购买系统路由
app.use('/api/purchase', purchaseRouter);

console.log('✅ 购买系统 API 已注册: /api/purchase');
```

**完整示例：**

```typescript
// server/index.ts
import express from 'express';
import purchaseRouter from './routes/purchase';
import graveRouter from './routes/grave';
import authRouter from './routes/auth';

const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRouter);
app.use('/api/graves', graveRouter);
app.use('/api/purchase', purchaseRouter);  // ← 添加此行

// 启动服务器
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

---

### 第 3 步：更新墓地创建验证

修改 `server/routes/grave.ts` 中的墓地创建端点：

**之前：**
```typescript
const validation = GraveService.validateCanCreateGrave(
  role,
  userGraveCount,
  blockId
);
```

**之后：**
```typescript
const validation = await GraveService.validateCanCreateGrave(
  role,
  userId,  // ← 改为传递 userId
  blockId
);
```

完整示例：

```typescript
// server/routes/grave.ts
router.post('/', requireLogin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const role = req.session.role;
    const { blockId, deceasedName, epitaph } = req.body;

    // 新的验证方式：支持多个墓地
    const validation = await GraveService.validateCanCreateGrave(
      role,
      userId,
      blockId
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // 创建墓地...
  } catch (error) {
    // 错误处理
  }
});
```

---

### 第 4 步：修改注册流程

在 `server/routes/auth.js` 中已经包含自动分配免费墓地的代码。确保导入了 `GravePurchaseService`：

```javascript
// server/routes/auth.js（已在上面修改过）
const { GravePurchaseService } = require('../services/GravePurchaseService');

// 在用户创建后自动分配免费墓地
try {
  await GravePurchaseService.initializeUserQuota(user.id);
  const config = await GravePurchaseService.getConfig() || 
                 await GravePurchaseService.initializeConfig();
  if (config && config.freeGravesPerUser > 0) {
    await GravePurchaseService.allocateFreeGraves(user.id, config.freeGravesPerUser);
  }
} catch (quotaError) {
  console.error('初始化用户墓地配额错误:', quotaError);
}
```

---

### 第 5 步：前端集成

#### 显示用户配额

```javascript
// frontend/js/user-profile.js
async function loadUserQuota() {
  try {
    const response = await fetch('/api/purchase/user/quota', {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('free-graves').innerText = 
        data.data.freeGravesAllocated;
      document.getElementById('purchased-graves').innerText = 
        data.data.purchasedGraves;
      document.getElementById('remaining-slots').innerText = 
        data.data.remainingSlots;
    }
  } catch (error) {
    console.error('加载配额错误:', error);
  }
}

loadUserQuota();
```

#### 购买流程

```javascript
// frontend/js/purchase.js
async function buyGraves(quantity) {
  // 1. 计算价格
  const priceRes = await fetch('/api/purchase/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  const pricing = await priceRes.json();
  
  // 2. 显示价格确认
  const totalPrice = pricing.data.totalPrice;
  if (!confirm(`确认购买 ${quantity} 块墓地，共需 ${totalPrice} USDT？`)) {
    return;
  }
  
  // 3. 创建订单
  const walletAddress = prompt('请输入您的钱包地址:');
  if (!walletAddress) return;
  
  const orderRes = await fetch('/api/purchase/create-order', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quantity,
      walletAddress,
      blockchainNetwork: 'Ethereum'
    })
  });
  
  const order = await orderRes.json();
  
  if (order.success) {
    alert(`订单已创建！订单 ID: ${order.data.orderId}\n请完成支付...`);
    // 跳转到支付页面或显示支付二维码
  }
}
```

#### 显示购买历史

```javascript
// frontend/js/purchase-history.js
async function loadPurchaseHistory() {
  const response = await fetch('/api/purchase/history?limit=50', {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });
  const data = await response.json();
  
  if (data.success) {
    const html = data.data.records.map(record => `
      <tr>
        <td>${record.id}</td>
        <td>${record.quantity}</td>
        <td>${record.usdtAmount} USDT</td>
        <td><span class="badge badge-${record.status}">${record.status}</span></td>
        <td>${new Date(record.purchaseDate).toLocaleDateString('zh-CN')}</td>
      </tr>
    `).join('');
    
    document.getElementById('history-table').innerHTML = html;
  }
}

loadPurchaseHistory();
```

---

### 第 6 步：环境配置

在 `.env` 文件中添加配置（可选）：

```env
# 墓地购买系统配置
GRAVE_FREE_COUNT=1
GRAVE_USDT_PRICE=100
GRAVE_PURCHASE_ENABLED=true

# 区块链配置
BLOCKCHAIN_NETWORKS=Ethereum,Tron,Polygon
WALLET_VALIDATION=true
```

在 `server/config/grave-purchase.ts` 中读取：

```typescript
export function getGraveConfig(): GraveSystemConfig {
  const env = process.env.NODE_ENV || 'development';
  const config = { ...ENVIRONMENT_CONFIGS[env] };
  
  // 覆盖环境变量
  if (process.env.GRAVE_FREE_COUNT) {
    config.freeGravesPerUser = parseInt(process.env.GRAVE_FREE_COUNT);
  }
  if (process.env.GRAVE_USDT_PRICE) {
    config.usdtPricePerGrave = parseFloat(process.env.GRAVE_USDT_PRICE);
  }
  
  return config;
}
```

---

## ✅ 集成验证检查表

运行以下命令验证集成是否成功：

### 1. 检查数据库表

```bash
mysql -u root -p solar_system -e "SHOW TABLES LIKE 'grave_purchase%';" \
  SHOW TABLES LIKE 'user_grave%';" \
  SHOW TABLES LIKE 'free_grave%';"
```

应该看到以下表：
- `grave_purchase_config`
- `grave_purchase_records`
- `user_grave_quota`
- `free_grave_allocation_records`

### 2. 测试 API

```bash
# 测试配置端点
curl http://localhost:3000/api/purchase/config | jq .

# 如果返回成功，说明路由已注册
```

### 3. 测试用户注册

```bash
# 注册新用户，检查是否自动分配了免费墓地
# 查看数据库
mysql -u root -p solar_system -e \
  "SELECT * FROM user_grave_quota WHERE user_id = <新用户ID>;"

# 应该看到 free_graves_allocated = 1
```

### 4. 运行自动化测试

```bash
bash test-purchase-system.sh
```

---

## 🚀 部署到生产环境

### 1. 更新环境变量

```env
NODE_ENV=production
GRAVE_USDT_PRICE=100
GRAVE_PURCHASE_ENABLED=true
```

### 2. 运行数据库迁移

```bash
bash database-migration-purchase.sh
```

### 3. 重启应用

```bash
# 使用 PM2 或你的部署工具
pm2 restart solar-system
```

### 4. 验证部署

```bash
curl https://yourdomain.com/api/purchase/config
```

---

## 📊 监控和维护

### 定期检查

```sql
-- 每周运行一次
-- 检查未确认订单
SELECT * FROM grave_purchase_records 
WHERE status = 'pending' 
AND DATE(purchase_date) < DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- 检查数据一致性
SELECT u.id, u.username, 
  (SELECT COUNT(*) FROM graves WHERE user_id = u.id) as grave_count,
  (q.free_graves_allocated + q.purchased_graves) as available_slots
FROM users u
LEFT JOIN user_grave_quota q ON u.id = q.user_id
HAVING grave_count > available_slots;
```

### 定期备份

```bash
# 备份购买相关数据
mysqldump -u root -p solar_system \
  grave_purchase_config \
  user_grave_quota \
  grave_purchase_records \
  free_grave_allocation_records \
  > backup_purchase_$(date +%Y%m%d).sql
```

---

## 🔍 故障排查

### 问题 1: 用户注册成功但未分配免费墓地

**检查步骤：**
1. 查看应用日志中是否有错误
2. 检查数据库是否有 `user_grave_quota` 记录
3. 确保 `GravePurchaseService.initializeConfig()` 被调用

**解决方案：**
```sql
-- 为未初始化的用户添加配额
INSERT INTO user_grave_quota (user_id, free_graves_allocated, purchased_graves)
SELECT id, 1, 0 FROM users 
WHERE id NOT IN (SELECT user_id FROM user_grave_quota);
```

### 问题 2: API 返回 404

**检查步骤：**
1. 确保路由已注册：`app.use('/api/purchase', purchaseRouter);`
2. 确保导入路径正确
3. 检查应用是否已重启

### 问题 3: 用户无法创建墓地（提示配额已满）

**检查步骤：**
1. 查询用户配额：
   ```sql
   SELECT * FROM user_grave_quota WHERE user_id = ?;
   ```
2. 查询已创建的墓地：
   ```sql
   SELECT COUNT(*) FROM graves WHERE user_id = ?;
   ```
3. 比较两者，应该是 `grave_count < available_slots`

---

## 📞 获取帮助

- 查看完整文档：`GRAVE_PURCHASE_SYSTEM.md`
- 查看快速参考：`QUICK_REFERENCE.md`
- 检查应用日志和数据库日志
- 运行测试脚本：`test-purchase-system.sh`

---

**版本**: 1.0  
**最后更新**: 2024-01-01
