# MyGrave 分项隐私管理系统指南

## 📋 功能概述

MyGrave 提供了强大的**分项隐私管理系统**，允许用户对坟墓信息的每一项进行独立的隐私控制：

- 🔐 **分项设置** - 每个字段都可独立配置隐私级别
- 🔓 **灵活公开** - 公开、隐私、选择性公开三种级别
- 👥 **权限申请** - 其他用户可申请查看隐私信息
- ⏳ **时效管理** - 设置隐私信息的自动公开时间
- ✅ **权限授权** - 坟墓主人审核和批准权限申请

---

## 🎯 隐私级别

### 1. 公开 (PUBLIC)
```
☀️ 任何人都可以查看此字段
- 游客可见
- 无需权限申请
- 无时间限制
```

### 2. 隐私 (PRIVATE)
```
🔒 仅坟墓主人可见
- 其他用户无法查看
- 可申请查看权限（如果允许）
- 坟墓主人需手动批准
```

### 3. 选择性公开 (SELECTIVE)
```
🔑 仅特定用户可见
- 指定用户列表可直接查看
- 其他用户可申请权限
- 坟墓主人批准后可访问
```

---

## 📊 可配置的字段

所有这些字段都可独立设置隐私级别：

| 字段 | 描述 | 默认级别 |
|------|------|---------|
| `deceasedName` | 墓主人名字 | PUBLIC |
| `deceasedDate` | 出生/去世日期 | PUBLIC |
| `epitaph` | 墓志铭 | PUBLIC |
| `lifeOverview` | 生平概述 | PUBLIC |
| `selfEvaluation` | 自我评价 | PRIVATE |
| `othersEvaluation` | 他人评价 | SELECTIVE |
| `influenceOnOthers` | 对周围的影响 | PUBLIC |
| `wishesBeforeDeath` | 死前愿望清单 | PRIVATE |
| `video` | 个人视频 | SELECTIVE |
| `photos` | 照片 | SELECTIVE |
| `will` | 遗嘱 | PRIVATE |
| `inheritancePlan` | 遗产方案 | PRIVATE |
| `socialAccounts` | 社交账号 | PUBLIC |
| `viewCount` | 浏览次数 | PUBLIC |

---

## 🔧 使用场景

### 场景 1：基本公开配置

```typescript
// 用户 Alice 想让所有人都看到基本信息，但隐藏私人内容

设置:
- epitaph: PUBLIC        // 墓志铭公开
- lifeOverview: PUBLIC   // 生平概述公开
- will: PRIVATE          // 遗嘱隐私
- inheritancePlan: PRIVATE // 遗产方案隐私
```

**结果**：
- ✅ 游客可以看到墓志铭和生平
- ❌ 游客无法看到遗嘱和遗产方案
- 📝 其他用户可申请查看隐私信息

---

### 场景 2：选择性公开给亲属

```typescript
// 用户 Bob 想只对特定人（家人）公开某些内容

设置:
- will: SELECTIVE, allowedUsers: [1, 2, 3]  // 仅给家人看
- inheritancePlan: SELECTIVE, allowedUsers: [1, 2, 3]
- selfEvaluation: PUBLIC  // 其他信息公开
```

**结果**：
- ✅ 用户 1、2、3（家人）可直接看到遗嘱
- ❌ 其他用户无法查看
- 📝 其他用户可申请，但需要 Bob 手动批准

---

### 场景 3：时效管理

```typescript
// 用户 Carol 想让某些隐私信息在死后一年后自动公开

设置:
- selfEvaluation: PRIVATE, expiresAt: 2027-02-28
- othersEvaluation: PRIVATE, expiresAt: 2027-02-28

在 2027-02-28 时，这些字段自动改为 PUBLIC
```

**效果**：
- 🔒 现在完全隐私
- ⏳ 一年后自动公开
- 🔓 无需手动操作

---

## 👥 权限申请流程

```
1️⃣ 用户 Alice 想看 Bob 的隐私信息
   ↓
2️⃣ Alice 发起权限申请
   POST /api/permissions/request
   {
     "graveId": 1,
     "field": "selfEvaluation",
     "reason": "我是 Bob 的朋友，想了解更多"
   }
   ↓
3️⃣ Bob 收到待审批申请通知
   GET /api/permissions/requests/pending
   ↓
4️⃣ Bob 审查申请并批准（有效期 30 天）
   POST /api/permissions/requests/1/approve
   {
     "expiresAt": "2026-03-30"
   }
   ↓
5️⃣ Alice 现在可以查看该字段
   GET /api/graves/1
   {
     "selfEvaluation": "Bob 的自我评价内容..."
   }
```

---

## 🔒 隐私配置全局设置

### 配置项

```typescript
interface GravePrivacyConfig {
  // 是否允许他人申请查看私密信息
  allowRequestsForPrivate: boolean;
  
  // 每次申请都需要审批（vs 自动批准白名单用户）
  requireApprovalForEachRequest: boolean;
  
  // 权限默认有效期（天数）
  defaultExpirationDays: number;
  
  // 黑名单用户（无法申请）
  blockedUsers: number[];
  
  // 白名单用户（申请自动批准）
  trustedUsers: number[];
}
```

### 设置示例

```typescript
// 坟墓主人的全局隐私设置

POST /api/privacy/grave/1
{
  "allowRequestsForPrivate": true,
  "requireApprovalForEachRequest": true,
  "defaultExpirationDays": 30,
  "blockedUsers": [99, 100],      // 屏蔽这两个用户
  "trustedUsers": [5, 6, 7]       // 信任这三个用户（自动批准）
}
```

---

## 📡 API 端点快速参考

### 隐私设置管理

```bash
# 获取隐私配置
GET /api/privacy/grave/:graveId

# 更新隐私配置
POST /api/privacy/grave/:graveId
{
  "allowRequestsForPrivate": true,
  "defaultExpirationDays": 30
}

# 为特定字段设置隐私级别
POST /api/privacy/grave/:graveId/field/:field
{
  "level": "private",
  "allowedUserIds": [1, 2, 3],
  "expiresAt": "2027-02-28T00:00:00Z"
}

# 检查对字段的访问权限
GET /api/privacy/grave/:graveId/field/:field/access?viewerId=5

# 直接授予权限
POST /api/privacy/grant
{
  "graveId": 1,
  "userId": 5,
  "fields": ["selfEvaluation", "will"],
  "expiresAt": "2026-03-30"
}

# 撤销权限
DELETE /api/privacy/grant/:permissionId

# 获取隐私统计
GET /api/privacy/grave/:graveId/statistics
```

### 权限申请管理

```bash
# 申请查看权限
POST /api/permissions/request
{
  "graveId": 1,
  "field": "selfEvaluation",
  "reason": "我是 Bob 的朋友"
}

# 获取我的申请
GET /api/permissions/requests/me?status=pending

# 获取待审批申请（仅坟墓主人）
GET /api/permissions/requests/pending?graveId=1

# 批准申请
POST /api/permissions/requests/1/approve
{
  "expiresAt": "2026-03-30"
}

# 拒绝申请
POST /api/permissions/requests/1/reject
{
  "reason": "暂不公开此信息"
}

# 批量批准
POST /api/permissions/requests/batch/approve
{
  "requestIds": [1, 2, 3],
  "expiresAt": "2026-03-30"
}

# 撤销申请
DELETE /api/permissions/requests/1

# 获取申请统计
GET /api/permissions/requests/statistics?graveId=1
```

---

## 🔐 访问控制示例

### 坟墓主人查看自己的坟墓
```typescript
// ✅ 总是可以看到全部内容，无论隐私级别如何
GET /api/graves/1
Response: {
  epitaph: "...",
  lifeOverview: "...",
  selfEvaluation: "...",    // 即使是 PRIVATE 也能看到
  will: "..."
}
```

### 其他用户查看隐私坟墓
```typescript
// ❌ 无权限时
GET /api/graves/1?viewerId=5
Response: {
  epitaph: "...",           // PUBLIC，可见
  lifeOverview: "...",      // PUBLIC，可见
  selfEvaluation: null,     // PRIVATE，不可见
  will: null                // PRIVATE，不可见
  
  // 错误详情
  accessDenied: {
    selfEvaluation: "需要权限申请",
    will: "需要权限申请"
  }
}

// ✅ 有权限后
GET /api/graves/1?viewerId=5
Response: {
  epitaph: "...",
  lifeOverview: "...",
  selfEvaluation: "...",    // 已获权限，可见
  will: "..."               // 已获权限，可见
}
```

---

## ⏳ 时效管理详解

### 字段隐私时效

```typescript
// 设置字段在一年后自动公开
POST /api/privacy/grave/1/field/will
{
  "level": "private",
  "expiresAt": "2027-02-28T00:00:00Z"
}

在 2027-02-28 之后：
- 该字段自动从 PRIVATE 改为 PUBLIC
- expiresAt 清空
- 无需手动操作
```

### 权限有效期

```typescript
// 批准权限，设置 30 天有效期
POST /api/permissions/requests/1/approve
{
  "expiresAt": "2026-03-30T00:00:00Z"
}

30 天后：
- 权限自动失效
- 用户需重新申请
```

---

## 📊 权限管理界面建议

### 坟墓主人的权限管理界面

```
┌─────────────────────────────────────┐
│   权限管理                          │
├─────────────────────────────────────┤
│                                     │
│ 📊 统计信息                          │
│ ├─ 待审批申请: 3 件                 │
│ ├─ 已批准权限: 12 个                │
│ └─ 黑名单用户: 2 个                 │
│                                     │
│ 📋 待审批的申请                      │
│ ├─ [用户] 申请查看 [字段]           │
│ │  原因: ...                        │
│ │  [批准] [拒绝]                    │
│ └─ ...                              │
│                                     │
│ 🔑 已授权的权限                      │
│ ├─ [用户] 可访问: [字段列表]        │
│ │  有效期至: 2026-03-30             │
│ │  [撤销]                           │
│ └─ ...                              │
│                                     │
└─────────────────────────────────────┘
```

### 字段隐私配置界面

```
┌─────────────────────────────────────┐
│   字段隐私设置                      │
├─────────────────────────────────────┤
│                                     │
│ 字段: 自我评价                      │
│                                     │
│ 隐私级别:                           │
│ ○ 完全公开   - 所有人可见          │
│ ○ 完全隐私   - 仅我可见            │
│ ◉ 选择性公开 - 特定人可见          │
│                                     │
│ 允许的用户:                         │
│ [ID: 1] [x]                         │
│ [ID: 2] [x]                         │
│ [添加用户]                          │
│                                     │
│ 时效管理:                           │
│ ☐ 设置过期时间                      │
│ 📅 2027-02-28                       │
│    （在此日期后自动改为公开）      │
│                                     │
│             [保存] [取消]           │
│                                     │
└─────────────────────────────────────┘
```

---

## 🛡️ 最佳实践

### 为坟墓主人

1. **定期审查申请** - 及时批准或拒绝权限申请
2. **合理设置白名单** - 添加信任的人到自动批准列表
3. **使用黑名单** - 屏蔽骚扰者或不尊重的用户
4. **设置合理有效期** - 平衡隐私与分享
5. **定期审查权限** - 检查谁有权访问哪些信息

### 为权限申请者

1. **提供申请原因** - 增加被批准的可能性
2. **尊重隐私决定** - 接受拒绝
3. **妥善使用信息** - 不滥用获得的权限
4. **及时更新** - 权限过期前重新申请

---

## 🔄 工作流程

### 完整的隐私管理流程

```
1. 坟墓主人配置隐私
   └─ POST /api/privacy/grave/:graveId
   
2. 坟墓主人配置字段隐私
   └─ POST /api/privacy/grave/:graveId/field/:field
   
3. 其他用户查看坟墓
   ├─ 公开字段 → 直接显示
   └─ 隐私字段 → 提示"需要权限"
   
4. 其他用户申请权限
   └─ POST /api/permissions/request
   
5. 坟墓主人批准/拒绝
   ├─ POST /api/permissions/requests/:id/approve
   └─ POST /api/permissions/requests/:id/reject
   
6. 用户重新访问
   └─ GET /api/graves/:id
   └─ 现在可以看到授权的字段
   
7. 权限自动过期
   └─ 用户需重新申请
```

---

## 📞 常见问题

### Q: 时效过期后会发生什么？
**A:** 字段隐私或权限在设定的时间后自动改变：
- 字段隐私过期 → 自动改为 PUBLIC
- 权限过期 → 自动撤销，用户需重新申请

### Q: 坟墓主人可以随时撤销权限吗？
**A:** 是的。坟墓主人可以随时：
- 撤销已授予的权限
- 更改字段隐私级别
- 将用户加入黑名单

### Q: 申请会被拒绝吗？
**A:** 是的，坟墓主人可以出于任何原因拒绝申请。拒绝后：
- 用户无法访问该信息
- 用户可以再次申请

### Q: 白名单用户是否需要每次都获批？
**A:** 不需要。白名单用户的申请会自动批准（如果启用了自动批准）。

### Q: 可以设置多人访问的权限吗？
**A:** 是的。坟墓主人可以：
- 批准多个用户的申请
- 设置选择性公开给多个用户
- 批量授予权限

---

**最后更新**: 2026-02-28
