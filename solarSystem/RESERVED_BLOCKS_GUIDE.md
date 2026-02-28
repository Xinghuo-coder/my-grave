# 保留地块管理指南

## 📍 概述

MyGrave 系统为了管理和扩展而保留了地球表面地块的**前 5% 和后 5%**。这些保留的地块不对普通用户开放，只有系统管理员可以使用。

---

## 🔐 地块分配规则

### 地块总数
- **总地块数**: 127,000,000 个（约1.27亿）
- **用户可用**: 114,300,000 个（中间 90%）
- **系统保留**: 12,700,000 个（前后各 5%）

### 具体范围

```
前 5% 保留地块: 1 - 6,350,000
用户可用地块:  6,350,001 - 120,650,000
后 5% 保留地块: 120,650,001 - 127,000,000
```

---

## 💾 数据库实现

### 表结构更新

`grave_blocks` 表新增字段：

```sql
ALTER TABLE grave_blocks ADD COLUMN is_reserved BOOLEAN DEFAULT false 
COMMENT '是否为保留地块（前5%或后5%）';

-- 创建索引以提高查询性能
CREATE INDEX idx_is_reserved ON grave_blocks(is_reserved);
```

### 查询用户可用地块

```sql
-- 获取未被占用且非保留的地块
SELECT * FROM grave_blocks 
WHERE is_occupied = false 
  AND is_reserved = false 
LIMIT 20;

-- 按地块ID范围查询
SELECT * FROM grave_blocks 
WHERE id BETWEEN 6350001 AND 120650000
  AND is_occupied = false;
```

---

## 🔧 代码实现

### 1. 类型定义 (server/types/block.ts)

```typescript
export const BLOCK_RANGE_CONFIG = {
  MIN_BLOCK_ID: 1,
  MAX_BLOCK_ID: 127000000,
  RESERVED_PERCENTAGE: 5,
  
  getReservedRanges() {
    const total = this.MAX_BLOCK_ID - this.MIN_BLOCK_ID + 1;
    const reservedCount = Math.floor(total * (this.RESERVED_PERCENTAGE / 100));
    
    return {
      minReserved: 1,
      maxReserved1: 6350000,        // 前 5%
      minReserved2: 120650001,      // 后 5% 起点
      maxReserved2: 127000000,      // 后 5% 终点
      userMin: 6350001,              // 用户可用范围
      userMax: 120650000
    };
  },
  
  isBlockReserved(blockId: number): boolean {
    // 判断是否为保留地块
  },
  
  isBlockAvailableForUser(blockId: number): boolean {
    // 判断是否在用户可用范围内
  }
};
```

### 2. 业务逻辑 (server/services/GraveService.ts)

```typescript
// 创建坟墓时验证地块
validateCanCreateGrave(role: UserRole, userGraveCount: number, blockId?: number) {
  // 检查用户角色和坟墓数量...
  
  // 验证地块是否被保留
  if (blockId && !BLOCK_RANGE_CONFIG.isBlockAvailableForUser(blockId)) {
    return {
      valid: false,
      error: '选择的地块被保留，不对用户开放。请选择其他地块。'
    };
  }
}

// 验证地块可用性
validateBlockAvailability(block: GraveBlock) {
  if (block.isReserved) {
    return {
      valid: false,
      error: '该地块为保留地块，不对用户开放。'
    };
  }
}
```

### 3. API 路由 (server/routes/block.ts)

```typescript
// 获取可用地块列表
router.get('/available', (req, res) => {
  const ranges = BLOCK_RANGE_CONFIG.getReservedRanges();
  
  // 数据库查询：
  // SELECT * FROM grave_blocks 
  // WHERE is_occupied = false 
  //   AND is_reserved = false
  //   AND id BETWEEN ? AND ?
  // LIMIT 20
  
  res.json({
    data: {
      blocks: [],
      availableRange: {
        min: ranges.userMin,
        max: ranges.userMax
      }
    }
  });
});

// 获取单个地块
router.get('/:blockId', (req, res) => {
  const blockId = parseInt(req.params.blockId);
  
  // 检查是否为保留地块
  if (BLOCK_RANGE_CONFIG.isBlockReserved(blockId)) {
    return res.status(403).json({
      success: false,
      message: '该地块为保留地块，不对用户开放'
    });
  }
  
  // 返回地块信息...
});
```

---

## 🛡️ 访问控制

### 用户操作限制

| 操作 | 游客 | 普通用户 | 管理员 |
|------|------|--------|-------|
| 查看用户地块 | ✅ | ✅ | ✅ |
| 在用户地块创建坟墓 | ❌ | ✅ | ✅ |
| 查看保留地块信息 | ❌ | ❌ | ✅ |
| 在保留地块创建坟墓 | ❌ | ❌ | ✅ |
| 修改地块状态 | ❌ | ❌ | ✅ |

### 前端验证

```typescript
// 防止用户选择保留地块
function isBlockSelectable(blockId: number): boolean {
  return BLOCK_RANGE_CONFIG.isBlockAvailableForUser(blockId);
}

// 显示可用范围提示
function getAvailableRangeInfo() {
  const ranges = BLOCK_RANGE_CONFIG.getReservedRanges();
  return `可用地块范围: ${ranges.userMin} - ${ranges.userMax}`;
}
```

---

## 🔧 管理员操作

### 初始化保留地块

管理员可以运行脚本初始化所有保留地块：

```typescript
/**
 * 初始化保留地块（仅管理员）
 * 将前 5% 和后 5% 的地块标记为保留
 */
async function initializeReservedBlocks(db: Database) {
  const ranges = BLOCK_RANGE_CONFIG.getReservedRanges();
  
  // 标记前 5% 的地块为保留
  await db.query(
    `UPDATE grave_blocks SET is_reserved = true 
     WHERE id BETWEEN ? AND ?`,
    [ranges.minReserved, ranges.maxReserved1]
  );
  
  // 标记后 5% 的地块为保留
  await db.query(
    `UPDATE grave_blocks SET is_reserved = true 
     WHERE id BETWEEN ? AND ?`,
    [ranges.minReserved2, ranges.maxReserved2]
  );
}
```

### 查询保留地块统计

```sql
-- 查看保留地块统计
SELECT 
  is_reserved,
  is_occupied,
  COUNT(*) as count
FROM grave_blocks
GROUP BY is_reserved, is_occupied;

-- 结果示例：
-- is_reserved | is_occupied | count
-- ------------|-------------|--------
-- 0           | 0           | 114288000
-- 0           | 1           | 12000
-- 1           | 0           | 12700000
-- 1           | 1           | 0
```

---

## ⚠️ 错误处理

### 常见错误码

| 错误码 | 场景 | 处理方式 |
|--------|------|--------|
| 403 | 尝试访问保留地块 | 返回禁止访问，提示用户选择其他地块 |
| 400 | 地块ID超出范围 | 返回参数错误，提示有效范围 |
| 409 | 地块已被占用 | 返回冲突，提示选择其他地块 |

### 错误响应示例

```json
{
  "success": false,
  "status": 403,
  "message": "该地块为保留地块，不对用户开放。请选择其他地块。",
  "data": {
    "availableRange": {
      "min": 6350001,
      "max": 120650000
    }
  }
}
```

---

## 📊 性能考虑

### 查询优化

```sql
-- 创建复合索引加快查询
CREATE INDEX idx_available_blocks ON grave_blocks(is_occupied, is_reserved, id);

-- 使用范围查询而不是 NOT IN
-- ✅ 好做法
SELECT * FROM grave_blocks 
WHERE id >= 6350001 AND id <= 120650000 AND is_occupied = false;

-- ❌ 避免
SELECT * FROM grave_blocks 
WHERE id NOT BETWEEN 1 AND 6350000 
  AND id NOT BETWEEN 120650001 AND 127000000;
```

### 缓存策略

```typescript
// 缓存保留范围信息以避免重复计算
const reservedRanges = BLOCK_RANGE_CONFIG.getReservedRanges();
// 在应用启动时计算一次，然后重复使用
```

---

## 🔄 迁移步骤

### 步骤 1: 更新数据库
```bash
# 添加 is_reserved 列
ALTER TABLE grave_blocks ADD COLUMN is_reserved BOOLEAN DEFAULT false;

# 创建索引
CREATE INDEX idx_is_reserved ON grave_blocks(is_reserved);
```

### 步骤 2: 初始化保留地块
```bash
# 运行初始化脚本（需要管理员权限）
npm run script:init-reserved-blocks
```

### 步骤 3: 更新应用代码
- 导入 `BLOCK_RANGE_CONFIG`
- 在地块查询中添加 `is_reserved = false` 过滤条件
- 在地块创建时验证范围

### 步骤 4: 更新前端
- 显示可用范围信息
- 在地块选择器中过滤保留地块
- 添加相应的错误提示

---

## 📝 最佳实践

### ✅ 推荐做法

1. **始终检查保留范围**
   ```typescript
   if (!BLOCK_RANGE_CONFIG.isBlockAvailableForUser(blockId)) {
     reject('选择的地块不可用');
   }
   ```

2. **提供清晰的反馈**
   - 显示可用地块范围
   - 解释为什么某些地块不可用

3. **缓存配置**
   - 在应用启动时计算一次范围
   - 避免重复的数学计算

4. **数据库优化**
   - 使用 `is_reserved` 字段而不是计算范围
   - 创建适当的索引

### ❌ 避免做法

1. **运行时计算范围**
   - 每次都计算 ID 范围会影响性能

2. **信任客户端验证**
   - 在服务器端再次验证所有选择

3. **忽视权限检查**
   - 确保只有授权用户可以访问/修改地块

4. **硬编码范围**
   - 使用配置而不是硬编码的数字

---

## 📞 常见问题

### Q: 为什么保留前 5% 和后 5% 的地块？
**A:** 这是为了：
- 预留空间用于未来功能扩展（纪念群、特殊活动区域等）
- 保持系统稳定性和灵活性
- 防止用户占用关键资源

### Q: 管理员可以修改保留范围吗？
**A:** 可以，但需要小心。修改 `BLOCK_RANGE_CONFIG` 并运行数据库迁移脚本。建议在系统初期进行，避免后期修改造成数据混乱。

### Q: 用户能看到保留地块吗？
**A:** 不能。API 会自动过滤保留地块，尝试直接访问会返回 403 错误。

### Q: 保留地块可以被转为普通地块吗？
**A:** 可以，管理员可以通过更新数据库中的 `is_reserved` 字段来实现，但这是不可逆的操作，建议谨慎执行。

---

**最后更新**: 2026-02-28
