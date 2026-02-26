# ========================================
# 安全配置快速参考
# ========================================

## 🔐 密钥生成

### Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 数据库密码
```bash
# 生成强密码（至少16位，包含大小写字母、数字、特殊字符）
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

---

## 🛡️ 安全最佳实践

### 1. 环境变量
- ✅ 使用 Google Secret Manager 存储敏感信息
- ✅ 生产环境禁用 `.env` 文件
- ✅ 定期轮换密钥
- ❌ 不要将 `.env.production` 提交到 Git

### 2. HTTPS/SSL
- ✅ Cloud Run 自动提供 SSL 证书
- ✅ 强制 HTTPS 重定向
- ✅ 启用 HSTS
- ✅ Cookie 设置 `secure: true`

### 3. CORS 配置
```javascript
// 生产环境只允许特定域名
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 4. 速率限制
```javascript
// 全局限制: 15分钟100次请求
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

// 登录接口: 15分钟5次尝试（在代码中硬编码）
```

### 5. 数据库安全
- ✅ 使用参数化查询（已实现）
- ✅ 最小权限原则（应用用户不需要 DROP/CREATE）
- ✅ 启用 Cloud SQL SSL 连接
- ✅ 私有 IP 连接（通过 VPC Connector）
- ✅ 自动备份

---

## 📋 部署前检查清单

### Google Cloud 配置
- [ ] 项目已创建并启用计费
- [ ] 所有必要的 API 已启用
- [ ] Cloud SQL 实例已创建
- [ ] 数据库和用户已配置
- [ ] Secret Manager 密钥已创建
- [ ] VPC Connector 已创建（如使用私有 IP）

### 密钥配置
- [ ] `session-secret` 已创建（使用强随机密钥）
- [ ] `db-password` 已创建（使用强密码）
- [ ] `smtp-password` 已创建（如需邮件）
- [ ] `sms-api-key` 已创建（如需短信）

### 服务账户权限
- [ ] Cloud Run 服务账户可访问 Secret Manager
- [ ] Cloud Run 服务账户可连接 Cloud SQL
- [ ] Cloud Build 服务账户可部署 Cloud Run

### 环境变量
- [ ] `NODE_ENV=production`
- [ ] `GCP_PROJECT_ID` 已配置
- [ ] `USE_SECRET_MANAGER=true`
- [ ] `FRONTEND_URL` 已配置
- [ ] `ALLOWED_ORIGINS` 已配置
- [ ] `DB_HOST` 使用 Cloud SQL 连接名称

### 安全设置
- [ ] Cookie `secure` 设为 `true`
- [ ] Helmet 安全头已启用
- [ ] 速率限制已配置
- [ ] CORS 仅允许信任的域名
- [ ] XSS 和 SQL 注入防护已启用

### 监控和日志
- [ ] Cloud Logging 已启用
- [ ] 错误报告已启用
- [ ] 告警策略已配置
- [ ] 性能监控已设置

---

## 🔍 安全审计命令

### 检查 NPM 依赖漏洞
```bash
npm audit
npm audit fix
```

### 检查密钥权限
```bash
gcloud secrets get-iam-policy session-secret
gcloud secrets get-iam-policy db-password
```

### 检查 Cloud SQL 配置
```bash
gcloud sql instances describe solar-system-db \
  --format="table(settings.ipConfiguration)"
```

### 检查 Cloud Run 安全设置
```bash
gcloud run services describe solar-system-app \
  --region=asia-east1 \
  --format="table(spec.template.spec.containers[0].env)"
```

---

## 🚨 应急响应

### 密钥泄露处理
1. 立即创建新密钥版本
```bash
echo -n "NEW_SECRET_VALUE" | \
  gcloud secrets versions add session-secret --data-file=-
```

2. 更新 Cloud Run 服务
```bash
gcloud run deploy solar-system-app \
  --update-secrets=SESSION_SECRET=session-secret:latest \
  --region=asia-east1
```

3. 禁用旧密钥版本
```bash
gcloud secrets versions disable VERSION_NUMBER --secret=session-secret
```

### 数据库入侵响应
1. 立即更改数据库密码
2. 审查访问日志
3. 检查异常查询
4. 从备份恢复（如需要）

### DDoS 攻击响应
1. 启用 Cloud Armor
2. 降低速率限制阈值
3. 分析攻击来源
4. 配置 IP 黑名单

---

## 📱 联系方式

如有安全问题，请联系:
- 安全团队: security@yourdomain.com
- 紧急热线: +86-xxx-xxxx-xxxx
