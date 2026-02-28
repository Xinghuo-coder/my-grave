# 隐私管理系统实现检查清单

## 📋 实现阶段

### 第一阶段：类型系统 ✅ COMPLETED

- [x] 创建 `server/types/privacy.ts`
  - [x] PrivacyLevel 枚举 (PUBLIC, PRIVATE, SELECTIVE)
  - [x] GraveField 枚举 (11 个可配置字段)
  - [x] RequestStatus 枚举 (PENDING, APPROVED, REJECTED, EXPIRED)
  - [x] FieldPrivacy 接口
  - [x] PermissionRequest 接口
  - [x] GrantedPermission 接口
  - [x] AccessLog 接口
  - [x] GravePrivacyConfig 接口
  - [x] API 请求/响应类型

- [x] 更新 `server/types/grave.ts`
  - [x] 添加 fieldPrivacies?: FieldPrivacy[] 到 GraveInfo
  - [x] 导入隐私相关类型

---

### 第二阶段：业务逻辑 ✅ COMPLETED

- [x] 创建 `server/services/PrivacyService.ts`
  - [x] checkFieldAccess() - 字段访问权限检查
  - [x] validatePermissionRequest() - 权限申请验证
  - [x] shouldAutoApprove() - 自动批准检查（白名单）
  - [x] isUserBlocked() - 用户黑名单检查
  - [x] canRequestPermission() - 申请权限检查
  - [x] calculateExpiryDate() - 计算过期日期
  - [x] isPermissionExpired() - 权限过期检查
  - [x] isFieldPrivacyExpired() - 字段隐私过期检查
  - [x] handleExpiredPrivacy() - **关键**：自动转换过期隐私为PUBLIC
  - [x] validateApproval() - 批准参数验证
  - [x] calculatePrivacyStats() - 隐私统计计算
  - [x] checkMultipleFieldAccess() - 批量字段访问检查
  - [x] filterGraveFields() - 过滤可访问字段
  - [x] generatePermissionSummary() - 权限摘要生成

---

### 第三阶段：数据库架构 ✅ COMPLETED

- [x] 创建 `server/database/schema.privacy.ts`
  
  - [x] grave_privacy_configs 表
    - [x] id (主键)
    - [x] grave_id (外键)
    - [x] allow_requests_for_private (布尔)
    - [x] require_approval_for_each_request (布尔)
    - [x] default_expiration_days (整数)
    - [x] created_at / updated_at (时间戳)
    - [x] 索引: (grave_id)

  - [x] field_privacies 表
    - [x] id (主键)
    - [x] grave_id (外键)
    - [x] field_name (字段名)
    - [x] privacy_level (PUBLIC/PRIVATE/SELECTIVE)
    - [x] allowed_user_ids (JSON 数组)
    - [x] expires_at (过期时间)
    - [x] auto_public_at (自动公开时间)
    - [x] created_at / updated_at (时间戳)
    - [x] 索引: (grave_id, field_name), (expires_at)

  - [x] permission_requests 表
    - [x] id (主键)
    - [x] grave_id (外键)
    - [x] grave_owner_id (外键)
    - [x] requester_id (外键)
    - [x] field_name (字段名)
    - [x] reason (申请原因)
    - [x] status (PENDING/APPROVED/REJECTED/EXPIRED)
    - [x] responded_at (响应时间)
    - [x] granted_until (权限有效期至)
    - [x] access_count_limit (访问次数限制)
    - [x] created_at / updated_at (时间戳)
    - [x] 索引: (grave_id), (requester_id), (status), (created_at)

  - [x] granted_permissions 表
    - [x] id (主键)
    - [x] grave_id (外键)
    - [x] grave_owner_id (外键)
    - [x] user_id (用户ID)
    - [x] fields (JSON 数组 - 允许访问的字段列表)
    - [x] granted_at (授权时间)
    - [x] expires_at (过期时间)
    - [x] access_count (访问次数)
    - [x] created_at / updated_at (时间戳)
    - [x] 索引: (grave_id, user_id), (expires_at)

  - [x] access_logs 表
    - [x] id (主键)
    - [x] permission_id (外键)
    - [x] user_id (用户ID)
    - [x] field_name (字段名)
    - [x] accessed_at (访问时间)
    - [x] ip_address (IP地址)
    - [x] created_at (时间戳)
    - [x] 索引: (permission_id), (user_id), (accessed_at)

  - [x] privacy_blacklists 表
    - [x] id (主键)
    - [x] grave_id (外键)
    - [x] blocked_user_id (被屏蔽用户)
    - [x] reason (屏蔽原因)
    - [x] created_at / updated_at (时间戳)
    - [x] 索引: (grave_id, blocked_user_id)

  - [x] privacy_whitelists 表
    - [x] id (主键)
    - [x] grave_id (外键)
    - [x] trusted_user_id (信任用户)
    - [x] created_at / updated_at (时间戳)
    - [x] 索引: (grave_id, trusted_user_id)

---

### 第四阶段：API 路由 ✅ COMPLETED

- [x] 创建 `server/routes/privacy.ts` (隐私配置管理)
  - [x] GET /api/privacy/grave/:graveId
    - [ ] 实现：查询 grave_privacy_configs 和 field_privacies
    - [ ] 权限：任何人可查看自己的，其他人看不到隐私配置
  
  - [x] POST /api/privacy/grave/:graveId
    - [ ] 实现：更新 grave_privacy_configs
    - [ ] 权限：仅坟墓主人
  
  - [x] POST /api/privacy/grave/:graveId/field/:field
    - [ ] 实现：创建或更新 field_privacies
    - [ ] 权限：仅坟墓主人
  
  - [x] GET /api/privacy/grave/:graveId/field/:field/access
    - [ ] 实现：调用 PrivacyService.checkFieldAccess()
    - [ ] 权限：任何登录用户
  
  - [x] POST /api/privacy/grant
    - [ ] 实现：直接在 granted_permissions 中创建权限
    - [ ] 权限：仅坟墓主人
  
  - [x] DELETE /api/privacy/grant/:permissionId
    - [ ] 实现：删除 granted_permissions 记录
    - [ ] 权限：仅坟墓主人
  
  - [x] GET /api/privacy/grave/:graveId/permissions
    - [ ] 实现：查询 granted_permissions 和 permission_requests
    - [ ] 权限：仅坟墓主人
  
  - [x] GET /api/privacy/my-permissions
    - [ ] 实现：查询当前用户被授予的 granted_permissions
    - [ ] 权限：任何登录用户
  
  - [x] GET /api/privacy/grave/:graveId/statistics
    - [ ] 实现：调用 PrivacyService.calculatePrivacyStats()
    - [ ] 权限：仅坟墓主人

- [x] 创建 `server/routes/permission.ts` (权限申请工作流)
  - [x] POST /api/permissions/request
    - [ ] 实现：验证并创建 permission_requests
    - [ ] 验证：用户未被屏蔽、字段确实是隐私的
    - [ ] 权限：任何登录用户
  
  - [x] GET /api/permissions/requests/me
    - [ ] 实现：查询当前用户的 permission_requests
    - [ ] 支持过滤：?status=pending, ?graveId=1
    - [ ] 权限：任何登录用户
  
  - [x] GET /api/permissions/requests/pending
    - [ ] 实现：查询特定坟墓的待审批申请
    - [ ] 支持过滤：?graveId=1, ?field=selfEvaluation
    - [ ] 权限：仅坟墓主人
  
  - [x] GET /api/permissions/requests/:requestId
    - [ ] 实现：返回申请详情
    - [ ] 权限：申请人或坟墓主人
  
  - [x] POST /api/permissions/requests/:requestId/approve
    - [ ] 实现：更新 permission_requests.status = APPROVED
    - [ ] 实现：创建对应的 granted_permissions 记录
    - [ ] 权限：仅坟墓主人
  
  - [x] POST /api/permissions/requests/:requestId/reject
    - [ ] 实现：更新 permission_requests.status = REJECTED
    - [ ] 权限：仅坟墓主人
  
  - [x] POST /api/permissions/requests/batch/approve
    - [ ] 实现：批量批准申请
    - [ ] 实现：批量创建 granted_permissions 记录
    - [ ] 权限：仅坟墓主人
  
  - [x] POST /api/permissions/requests/batch/reject
    - [ ] 实现：批量拒绝申请
    - [ ] 权限：仅坟墓主人
  
  - [x] DELETE /api/permissions/requests/:requestId
    - [ ] 实现：删除（如果状态为PENDING）或标记为EXPIRED
    - [ ] 权限：申请人
  
  - [x] GET /api/permissions/requests/statistics
    - [ ] 实现：计算各种申请统计数据
    - [ ] 返回：待审批数、已批准数、已拒绝数等
    - [ ] 权限：仅坟墓主人

---

### 第五阶段：中间件与集成 ⏳ PENDING

- [ ] 更新 `server/middleware/authorization.ts`
  - [ ] 添加 `requireOwnerOrApproved` 中间件
    - [ ] 检查用户是否是坟墓主人或有批准的权限
  
  - [ ] 添加 `checkFieldAccess` 中间件
    - [ ] 在获取墓地数据前调用 PrivacyService
    - [ ] 过滤不可访问的字段

- [ ] 更新 `server/routes/grave.ts`
  - [ ] GET /api/graves/:id
    - [ ] 添加 checkFieldAccess 中间件
    - [ ] 调用 PrivacyService.filterGraveFields()
    - [ ] 返回 accessDenied 对象提示哪些字段无权访问
  
  - [ ] POST /api/graves/:id/view
    - [ ] 仅当用户有权限查看时记录浏览
    - [ ] 调用 access_logs 记录

- [ ] 更新 `server/services/GraveService.ts`
  - [ ] 在 filterGraveContent() 中添加隐私检查
  - [ ] 使用 PrivacyService 过滤字段

---

### 第六阶段：时效管理 ⏳ PENDING

- [ ] 创建 `server/jobs/privacyExpiry.job.ts`
  - [ ] 定时任务：每小时运行一次
  - [ ] 检查所有过期的 field_privacies
  - [ ] 调用 PrivacyService.handleExpiredPrivacy()
  - [ ] 自动将过期的 PRIVATE/SELECTIVE 改为 PUBLIC
  - [ ] 检查所有过期的 granted_permissions
  - [ ] 自动删除或标记为过期

- [ ] 在 `server/index.ts` 中启动定时任务

---

### 第七阶段：前端组件 ⏳ PENDING

- [ ] 创建隐私设置页面 (`src/pages/PrivacySettings.tsx`)
  - [ ] 字段隐私级别选择器
  - [ ] 白名单用户管理
  - [ ] 黑名单用户管理
  - [ ] 全局隐私配置

- [ ] 创建权限申请界面 (`src/pages/PermissionRequest.tsx`)
  - [ ] 显示隐私字段并提示需要权限
  - [ ] 申请权限表单
  - [ ] 申请历史记录

- [ ] 创建权限管理界面 (`src/pages/PermissionManager.tsx`)
  - [ ] 待审批申请列表
  - [ ] 已授权权限列表
  - [ ] 批准/拒绝界面
  - [ ] 权限统计信息

- [ ] 更新墓地卡片组件
  - [ ] 显示隐私字段状态
  - [ ] 添加"申请权限"按钮
  - [ ] 显示申请状态

---

### 第八阶段：测试 ⏳ PENDING

- [ ] 单元测试
  - [ ] PrivacyService 所有方法
  - [ ] 过期时间计算
  - [ ] 权限检查逻辑
  - [ ] 黑白名单检查

- [ ] 集成测试
  - [ ] 完整的申请流程（申请 → 批准 → 访问）
  - [ ] 过期处理（字段隐私过期、权限过期）
  - [ ] 批量操作
  - [ ] 黑白名单功能

- [ ] E2E 测试
  - [ ] 用户隐私配置工作流
  - [ ] 权限申请和批准工作流
  - [ ] 时效管理工作流

---

### 第九阶段：文档与部署 ⏳ PENDING

- [ ] API 文档
  - [ ] 隐私管理 API 详细文档
  - [ ] 权限申请 API 详细文档
  - [ ] 错误码说明
  - [ ] 示例请求/响应

- [ ] 数据库迁移脚本
  - [ ] 生成 migration 文件
  - [ ] 测试迁移过程
  - [ ] 添加回滚脚本

- [ ] 部署检查清单
  - [ ] 环境变量配置
  - [ ] 数据库权限
  - [ ] 定时任务配置
  - [ ] 日志配置

---

## 🔑 关键实现要点

### 1. 时效处理 ⚠️ CRITICAL

在返回墓地数据之前**必须**调用 `PrivacyService.handleExpiredPrivacy()`：

```typescript
// 在 grave.ts 的 GET /api/graves/:id 路由中
const graveData = await getGraveFromDB(graveId);

// ⚠️ 关键步骤：处理过期隐私
await PrivacyService.handleExpiredPrivacy(graveId);

// 然后过滤访问权限
const filteredData = await PrivacyService.filterGraveFields(
  graveData,
  req.user?.id
);

res.json(filteredData);
```

### 2. 访问权限检查

每次用户尝试访问隐私字段时：

```typescript
const hasAccess = await PrivacyService.checkFieldAccess(
  graveId,
  'selfEvaluation',
  userId
);

if (!hasAccess) {
  return res.status(403).json({ 
    error: 'No access to this field',
    suggestion: 'Request permission from grave owner'
  });
}
```

### 3. 批准权限时

```typescript
const request = await getPermissionRequest(requestId);

if (await PrivacyService.shouldAutoApprove(
  request.graveId,
  request.requesterId
)) {
  // 自动批准（白名单用户）
  status = 'APPROVED';
  expiresAt = now + defaultExpirationDays;
} else {
  // 需要手动批准
  status = 'PENDING';
}

// 创建授权记录
await createGrantedPermission({
  grave_id: request.graveId,
  user_id: request.requesterId,
  fields: [request.field],
  expires_at: expiresAt
});
```

---

## 📊 实现优先级

### 高优先级（必须先完成）
1. ✅ 类型系统
2. ✅ 业务逻辑（PrivacyService）
3. ✅ 数据库架构
4. 🔴 实现隐私设置路由
5. 🔴 实现权限申请路由
6. 🔴 实现权限批准/拒绝路由

### 中优先级
7. 🟡 添加中间件集成
8. 🟡 时效处理定时任务
9. 🟡 前端隐私设置 UI
10. 🟡 前端权限申请 UI

### 低优先级
11. 🟢 权限管理仪表板
12. 🟢 访问日志查看
13. 🟢 邮件通知
14. 🟢 高级统计分析

---

## ✅ 验证检查点

### 数据库设置检查
- [ ] 所有 7 个表都已创建
- [ ] 所有外键关系正确
- [ ] 所有索引都已创建
- [ ] JSON 字段类型正确
- [ ] 时间戳字段有默认值

### 路由测试检查
- [ ] 隐私配置端点返回 200
- [ ] 权限申请端点返回 201
- [ ] 批准端点正确更新数据库
- [ ] 拒绝端点记录拒绝原因
- [ ] 过期端点自动转换隐私级别

### 权限检查
- [ ] 非坟墓主人无法修改隐私设置
- [ ] 被屏蔽用户无法申请
- [ ] 白名单用户自动批准
- [ ] 过期权限无法访问
- [ ] 过期字段隐私自动改为 PUBLIC

---

**最后更新**: 2026-02-28
