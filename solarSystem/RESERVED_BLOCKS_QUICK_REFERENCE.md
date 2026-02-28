# 保留地块快速参考

## 🎯 一句话总结
**地块编号前 5% (1-6,350,000) 和后 5% (120,650,001-127,000,000) 被保留，用户只能在中间 90% 的地块 (6,350,001-120,650,000) 创建坟墓。**

---

## 📊 数字速查表

| 指标 | 数值 |
|------|------|
| 总地块数 | 127,000,000 |
| 前 5% 保留 | 1 - 6,350,000 |
| **用户可用** | **6,350,001 - 120,650,000** |
| 后 5% 保留 | 120,650,001 - 127,000,000 |
| 保留地块总数 | 12,700,000 |
| **用户可用地块** | **114,300,000** |

---

## 🔧 代码速查

### 导入配置
```typescript
import { BLOCK_RANGE_CONFIG } from '../types/block';
```

### 检查地块是否被保留
```typescript
const isReserved = BLOCK_RANGE_CONFIG.isBlockReserved(blockId);
// true: 被保留，false: 用户可用
```

### 检查地块是否在用户可用范围内
```typescript
const isAvailable = BLOCK_RANGE_CONFIG.isBlockAvailableForUser(blockId);
// true: 用户可用，false: 被保留
```

### 创建坟墓前验证
```typescript
const validation = GraveService.validateCanCreateGrave(
  role,           // 用户角色 (GUEST 或 USER)
  userGraveCount, // 用户已有的坟墓数
  blockId         // 选择的地块 ID
);

if (!validation.valid) {
  // validation.error 包含错误信息
}
```

### 验证地块可用性
```typescript
const blockValidation = GraveService.validateBlockAvailability(block);

if (!blockValidation.valid) {
  // blockValidation.error 包含错误信息
}
```

---

## 📡 API 错误处理

### 尝试访问保留地块时
```bash
GET /api/blocks/1  # 保留地块
```

**响应** (403 Forbidden):
```json
{
  "success": false,
  "status": 403,
  "message": "该地块为保留地块，不对用户开放"
}
```

### 创建坟墓时选择保留地块
```bash
POST /api/graves
{
  "graveBlockId": 1
}
```

**错误信息**:
```
"选择的地块被保留，不对用户开放。请选择其他地块。"
```

---

## 🗄️ 数据库查询

### 查询用户可用的地块
```sql
SELECT * FROM grave_blocks 
WHERE is_occupied = false 
  AND is_reserved = false 
LIMIT 20;
```

### 查询可用范围内的特定地块
```sql
SELECT * FROM grave_blocks 
WHERE id BETWEEN 6350001 AND 120650000 
  AND is_occupied = false;
```

### 标记地块为保留（管理员仅用）
```sql
UPDATE grave_blocks 
SET is_reserved = true 
WHERE id BETWEEN 1 AND 6350000 
   OR id BETWEEN 120650001 AND 127000000;
```

---

## 🎛️ 前端集成

### 获取可用范围信息
```typescript
const ranges = BLOCK_RANGE_CONFIG.getReservedRanges();
console.log(`用户可在 ${ranges.userMin} ~ ${ranges.userMax} 之间选择地块`);
```

### 地块选择器过滤
```typescript
// 获取地块列表时
const availableBlocks = blocks.filter(block => 
  BLOCK_RANGE_CONFIG.isBlockAvailableForUser(block.id)
);
```

### 显示地块状态
```typescript
function getBlockStatus(blockId: number): string {
  if (BLOCK_RANGE_CONFIG.isBlockReserved(blockId)) {
    return '🔒 保留地块';
  }
  return '✅ 用户可用';
}
```

---

## ⚠️ 常见错误及解决

| 错误信息 | 原因 | 解决方案 |
|---------|------|--------|
| "该地块为保留地块" | 选择了前 5% 或后 5% 的地块 | 选择 6,350,001 - 120,650,000 范围的地块 |
| "每个账号只能创建一个坟墓" | 用户已有坟墓 | 编辑已有坟墓或删除后重新创建 |
| "只有正式用户才能创建" | 游客身份 | 登录或注册账号 |
| 地块已被占用 | 选择的地块已被使用 | 选择其他未被占用的地块 |

---

## 🔍 调试技巧

### 在浏览器控制台测试
```javascript
// 模拟 BLOCK_RANGE_CONFIG（需要从服务器获取）
const ranges = {
  userMin: 6350001,
  userMax: 120650000
};

function isAvailable(blockId) {
  return blockId >= ranges.userMin && blockId <= ranges.userMax;
}

console.log(isAvailable(1));           // false - 保留
console.log(isAvailable(6350001));    // true - 用户可用
console.log(isAvailable(120650000));  // true - 用户可用
console.log(isAvailable(127000000));  // false - 保留
```

### 日志调试
```typescript
// 在 GraveService 中添加日志
console.log(`检查地块 ${blockId}:`, {
  isReserved: BLOCK_RANGE_CONFIG.isBlockReserved(blockId),
  isAvailable: BLOCK_RANGE_CONFIG.isBlockAvailableForUser(blockId)
});
```

---

## 📱 移动端注意

- 确保在地块选择器中显示可用范围提示
- 预加载可用地块列表，避免用户尝试访问保留地块
- 提供清晰的错误提示，说明为什么某个地块不可用

---

## 🚀 性能优化建议

✅ **已优化**:
- 范围检查使用内存计算（< 1ms）
- 数据库查询使用索引

💡 **可继续优化**:
- 缓存可用地块列表（前端）
- 使用 Redis 缓存热门地块信息
- 批量查询时使用 WHERE IN 而不是多个单独查询

---

## 📞 快速问题解答

**Q: 为什么是前后各 5%？**
A: 为系统扩展、特殊活动、备用资源预留。

**Q: 可以修改保留比例吗？**
A: 可以，但需要修改 `BLOCK_RANGE_CONFIG` 并运行数据库迁移。

**Q: 保留地块可以转为普通吗？**
A: 可以，管理员可以更新 `is_reserved = false`。

**Q: 用户能看到保留地块吗？**
A: 不能，API 自动过滤。尝试访问返回 403。

**Q: 这个限制可以绕过吗？**
A: 不能，服务器端在三个位置验证：
  1. 创建坟墓时（GraveService）
  2. 查询地块时（routes）
  3. 数据库级别（is_reserved 字段）

---

**最后更新**: 2026-02-28
**版本**: 1.0
