# MyGrave 隐私管理快速参考

## 🎯 核心概念速查

### 隐私级别

| 级别 | 符号 | 谁能看 | 申请权限 | 常见用途 |
|------|------|--------|---------|---------|
| **PUBLIC** | 🔓 | 所有人 | 不需要 | 基本信息（名字、照片） |
| **PRIVATE** | 🔒 | 仅主人 | 需要 | 敏感信息（遗嘱、财务） |
| **SELECTIVE** | 🔑 | 指定人 + 申请 | 需要 | 半公开（亲属照片） |

---

## 🔄 快速流程

### 场景 1：我是坟墓主人 - 设置隐私

```bash
# 1. 获取当前隐私配置
GET /api/privacy/grave/1

# 2. 更新全局设置
POST /api/privacy/grave/1
{
  "allowRequestsForPrivate": true,
  "requireApprovalForEachRequest": true,
  "defaultExpirationDays": 30
}

# 3. 设置字段隐私
POST /api/privacy/grave/1/field/will
{
  "level": "private",           # PUBLIC | PRIVATE | SELECTIVE
  "allowedUserIds": [5, 6, 7],  # SELECTIVE 模式需要
  "expiresAt": "2027-02-28"     # 可选：设置过期时间
}

# 4. 查看权限管理
GET /api/privacy/grave/1/permissions

# 5. 手动授权
POST /api/privacy/grant
{
  "graveId": 1,
  "userId": 10,
  "fields": ["selfEvaluation", "photos"],
  "expiresAt": "2026-03-30"
}
```

### 场景 2：我是其他用户 - 申请权限

```bash
# 1. 查看什么字段无权访问
GET /api/graves/1
# 响应: { epitaph: "...", will: null, accessDenied: { will: "需要权限" } }

# 2. 申请权限
POST /api/permissions/request
{
  "graveId": 1,
  "field": "will",
  "reason": "我是 Bob 的亲属，想了解他的财务安排"
}
# 响应: { requestId: 1, status: "PENDING", createdAt: "2026-02-28" }

# 3. 查看申请状态
GET /api/permissions/requests/me
# 或特定申请
GET /api/permissions/requests/1
```

### 场景 3：我是坟墓主人 - 审批权限

```bash
# 1. 查看待审批申请
GET /api/permissions/requests/pending?graveId=1

# 2. 批准申请
POST /api/permissions/requests/1/approve
{
  "expiresAt": "2026-03-30"  # 可选：限制有效期
}

# 3. 拒绝申请
POST /api/permissions/requests/1/reject
{
  "reason": "暂时不想公开此信息"  # 可选
}

# 4. 撤销权限
DELETE /api/privacy/grant/1

# 5. 查看权限统计
GET /api/privacy/grave/1/statistics
```

---

## 🛠️ 代码集成示例

### 检查字段访问权限

```typescript
import { PrivacyService } from '../services/PrivacyService';

// 在路由处理中
async function getGraveDetails(req, res) {
  const { graveId } = req.params;
  const viewerId = req.user?.id;

  try {
    // 1. 获取墓地数据
    const graveData = await Grave.findById(graveId);

    // 2. 处理过期隐私（关键！）
    await PrivacyService.handleExpiredPrivacy(graveId);

    // 3. 过滤可访问字段
    const filteredData = await PrivacyService.filterGraveFields(
      graveData,
      viewerId
    );

    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 批准权限申请

```typescript
async function approvePermission(req, res) {
  const { requestId } = req.params;
  const { expiresAt } = req.body;
  const approverId = req.user.id;

  try {
    // 1. 获取申请
    const request = await PermissionRequest.findById(requestId);

    // 2. 验证审批者是坟墓主人
    if (request.graveOwnerId !== approverId) {
      return res.status(403).json({ error: '只有坟墓主人可以批准' });
    }

    // 3. 创建授权记录
    await GrantedPermission.create({
      grave_id: request.graveId,
      user_id: request.requesterId,
      fields: [request.field],
      expires_at: expiresAt || null
    });

    // 4. 更新申请状态
    request.status = 'APPROVED';
    request.respondedAt = new Date();
    request.grantedUntil = expiresAt;
    await request.save();

    res.json({ success: true, message: '权限已批准' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

## ⏳ 时效管理

### 字段隐私过期

```typescript
// 设置
POST /api/privacy/grave/1/field/will
{
  "level": "private",
  "expiresAt": "2027-02-28"  // 2027 年 2 月 28 日过期
}

// 在 2027-02-28 00:00:00 之后：
// will 字段自动改为 PUBLIC
// expiresAt 清空
// 无需手动操作
```

### 权限过期

```typescript
// 批准权限，设置 30 天有效期
POST /api/permissions/requests/1/approve
{
  "expiresAt": "2026-03-30"
}

// 2026-03-30 之后：
// 用户无法再访问此字段
// 需要重新申请
// 自动从 granted_permissions 删除
```

---

## 📊 常见查询

### 查看我的权限

```bash
GET /api/privacy/my-permissions

# 响应
{
  "permissions": [
    {
      "id": 1,
      "graveId": 1,
      "fields": ["selfEvaluation", "photos"],
      "grantedAt": "2026-02-28",
      "expiresAt": "2026-03-30"
    }
  ]
}
```

### 查看待审批

```bash
GET /api/permissions/requests/pending?graveId=1

# 响应
{
  "requests": [
    {
      "id": 1,
      "requesterId": 5,
      "requesterName": "张三",
      "field": "will",
      "reason": "亲属需要了解财务",
      "status": "PENDING",
      "createdAt": "2026-02-25"
    }
  ]
}
```

### 统计信息

```bash
GET /api/privacy/grave/1/statistics

# 响应
{
  "totalFields": 14,
  "publicFields": 8,
  "privateFields": 4,
  "selectiveFields": 2,
  "pendingRequests": 3,
  "approvedPermissions": 12,
  "blockedUsers": 2,
  "trustedUsers": 5
}
```

---

## 🚀 关键 API 端点

### 隐私设置 (`/api/privacy/*`)

```
GET    /api/privacy/grave/:id              获取隐私配置
POST   /api/privacy/grave/:id              更新隐私配置
POST   /api/privacy/grave/:id/field/:name  设置字段隐私
GET    /api/privacy/grave/:id/field/:name/access  检查访问权限
POST   /api/privacy/grant                  直接授予权限
DELETE /api/privacy/grant/:id              撤销权限
GET    /api/privacy/grave/:id/permissions  查看全部权限
GET    /api/privacy/my-permissions         我的权限
GET    /api/privacy/grave/:id/statistics   隐私统计
```

### 权限申请 (`/api/permissions/*`)

```
POST   /api/permissions/request                申请权限
GET    /api/permissions/requests/me            我的申请
GET    /api/permissions/requests/pending       待审批（主人）
GET    /api/permissions/requests/:id           申请详情
POST   /api/permissions/requests/:id/approve   批准
POST   /api/permissions/requests/:id/reject    拒绝
POST   /api/permissions/requests/batch/approve 批量批准
POST   /api/permissions/requests/batch/reject  批量拒绝
DELETE /api/permissions/requests/:id           撤销申请
GET    /api/permissions/requests/statistics    申请统计
```

---

## 🔐 权限矩阵

| 操作 | 游客 | 普通用户 | 坟墓主人 | 管理员 |
|------|------|---------|---------|--------|
| 查看 PUBLIC 字段 | ✅ | ✅ | ✅ | ✅ |
| 查看 PRIVATE 字段 | ❌ | ❌ | ✅ | ✅ |
| 查看 SELECTIVE 字段（无权限） | ❌ | ❌ | ✅ | ✅ |
| 申请权限 | ❌ | ✅ | - | ✅ |
| 审批权限 | ❌ | ❌ | ✅ | ✅ |
| 设置隐私级别 | ❌ | ❌ | ✅ | ✅ |
| 设置黑名单 | ❌ | ❌ | ✅ | ✅ |
| 查看统计 | ❌ | ❌ | ✅ | ✅ |

---

## 💡 最佳实践

### ✅ 应该做

1. **定期检查申请** - 及时响应权限申请
2. **合理设置白名单** - 为常信任的人自动批准
3. **使用黑名单屏蔽** - 拒绝后可加入黑名单
4. **设置合理过期期限** - 平衡隐私和分享
5. **详写拒绝原因** - 让用户了解为什么拒绝

### ❌ 不应该做

1. **设置过长的过期期限** - 影响隐私保护
2. **不验证申请原因** - 任意批准请求
3. **忘记撤销权限** - 定期审查授权
4. **设置相同的过期时间** - 难以管理
5. **对所有人开放** - 失去隐私管理的意义

---

## 🔍 故障排查

### 问题：用户看不到权限申请按钮

**原因**：
1. allowRequestsForPrivate 设置为 false
2. 字段未设置为 PRIVATE/SELECTIVE
3. 用户被加入黑名单

**解决**：
```bash
POST /api/privacy/grave/:id
{ "allowRequestsForPrivate": true }
```

### 问题：权限自动过期了

**原因**：设置了 expiresAt，超过了该时间

**解决**：
- 重新申请权限
- 或让主人重新授权

### 问题：WHITE_LIST 不工作

**原因**：requireApprovalForEachRequest 为 true

**解决**：
```bash
POST /api/privacy/grave/:id
{ "requireApprovalForEachRequest": false }
```

---

## 📚 相关文档

- [隐私管理完整指南](./PRIVACY_MANAGEMENT_GUIDE.md)
- [实现检查清单](./PRIVACY_IMPLEMENTATION_CHECKLIST.md)
- [API 详细文档](./API_DOCUMENTATION.md)
- [数据库架构](./DATABASE_SCHEMA.md)

---

**最后更新**: 2026-02-28
