# ========================================
# Google Cloud 部署完整指南
# Solar System 3D 可视化项目
# ========================================

## 📋 目录
1. [前置准备](#前置准备)
2. [Google Cloud 项目设置](#google-cloud-项目设置)
3. [Cloud SQL MySQL 配置](#cloud-sql-mysql-配置)
4. [Secret Manager 配置](#secret-manager-配置)
5. [容器化部署](#容器化部署)
6. [Cloud Run 部署](#cloud-run-部署)
7. [CI/CD 配置](#cicd-配置)
8. [监控和日志](#监控和日志)
9. [故障排除](#故障排除)

---

## 🎯 前置准备

### 本地环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker Desktop (用于本地测试)
- Google Cloud SDK (gcloud CLI)

### 安装 Google Cloud SDK
```bash
# macOS
brew install google-cloud-sdk

# 或下载安装包
# https://cloud.google.com/sdk/docs/install

# 初始化 gcloud
gcloud init

# 登录
gcloud auth login
```

---

## ☁️ Google Cloud 项目设置

### 1. 创建 GCP 项目
```bash
# 创建新项目
gcloud projects create YOUR_PROJECT_ID --name="Solar System"

# 设置当前项目
gcloud config set project YOUR_PROJECT_ID

# 启用计费（必须）
# 在 https://console.cloud.google.com/billing 关联计费账户
```

### 2. 启用必要的 API
```bash
# 启用所需的 Google Cloud API
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  vpcaccess.googleapis.com \
  compute.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com
```

---

## 🗄️ Cloud SQL MySQL 配置

### 1. 创建 Cloud SQL 实例
```bash
# 创建 MySQL 8.0 实例
gcloud sql instances create solar-system-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=asia-east1 \
  --root-password=YOUR_TEMP_ROOT_PASSWORD \
  --backup \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --enable-bin-log

# 生产环境推荐配置
# --tier=db-n1-standard-1 (更高性能)
# --availability-type=REGIONAL (高可用)
```

### 2. 创建数据库和用户
```bash
# 创建数据库
gcloud sql databases create solar_system_db \
  --instance=solar-system-db

# 创建应用用户
gcloud sql users create solar_app_user \
  --instance=solar-system-db \
  --password=STRONG_PASSWORD_HERE
```

### 3. 配置连接
```bash
# 获取实例连接名称
gcloud sql instances describe solar-system-db \
  --format="value(connectionName)"

# 输出示例: your-project-id:asia-east1:solar-system-db
# 将此值配置到 .env.production 的 DB_HOST
```

---

## 🔐 Secret Manager 配置

### 1. 创建密钥
```bash
# Session Secret
echo -n "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" | \
  gcloud secrets create session-secret --data-file=-

# 数据库密码
echo -n "YOUR_DB_PASSWORD" | \
  gcloud secrets create db-password --data-file=-

# SMTP 密码
echo -n "YOUR_SMTP_PASSWORD" | \
  gcloud secrets create smtp-password --data-file=-

# SMS API Key
echo -n "YOUR_SMS_API_KEY" | \
  gcloud secrets create sms-api-key --data-file=-
```

### 2. 授予 Cloud Run 访问权限
```bash
# 获取项目编号
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# 授予 Secret Manager 访问权限
gcloud secrets add-iam-policy-binding session-secret \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🐳 容器化部署

### 1. 本地构建和测试
```bash
# 构建 Docker 镜像
docker build -t solar-system:local .

# 本地运行测试
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  solar-system:local

# 测试健康检查
curl http://localhost:8080/api/health
```

### 2. 推送到 Google Container Registry
```bash
# 配置 Docker 认证
gcloud auth configure-docker

# 标记镜像
docker tag solar-system:local gcr.io/YOUR_PROJECT_ID/solar-system:v1.0.0

# 推送镜像
docker push gcr.io/YOUR_PROJECT_ID/solar-system:v1.0.0
```

---

## 🚀 Cloud Run 部署

### 1. 创建 VPC Connector（用于私有 Cloud SQL 连接）
```bash
# 创建 VPC Connector
gcloud compute networks vpc-access connectors create solar-vpc-connector \
  --region=asia-east1 \
  --range=10.8.0.0/28
```

### 2. 部署到 Cloud Run
```bash
# 部署应用
gcloud run deploy solar-system-app \
  --image=gcr.io/YOUR_PROJECT_ID/solar-system:v1.0.0 \
  --region=asia-east1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=YOUR_PROJECT_ID,USE_SECRET_MANAGER=true,FRONTEND_URL=https://your-frontend-domain.com" \
  --set-secrets="SESSION_SECRET=session-secret:latest,DB_PASSWORD=db-password:latest" \
  --add-cloudsql-instances=YOUR_PROJECT_ID:asia-east1:solar-system-db \
  --vpc-connector=solar-vpc-connector

# 获取服务 URL
gcloud run services describe solar-system-app \
  --region=asia-east1 \
  --format="value(status.url)"
```

### 3. 配置自定义域名（可选）
```bash
# 映射自定义域名
gcloud run domain-mappings create \
  --service=solar-system-app \
  --domain=api.yourdomain.com \
  --region=asia-east1
```

---

## 🔄 CI/CD 配置

### 1. 连接 GitHub 仓库
```bash
# 在 Cloud Console 中连接仓库
# https://console.cloud.google.com/cloud-build/triggers
```

### 2. 创建 Cloud Build 触发器
```bash
# 使用 gcloud 创建触发器
gcloud builds triggers create github \
  --name="solar-system-deploy" \
  --repo-name=YOUR_REPO_NAME \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions="_CLOUD_SQL_INSTANCE=YOUR_PROJECT_ID:asia-east1:solar-system-db,_VPC_CONNECTOR=projects/YOUR_PROJECT_ID/locations/asia-east1/connectors/solar-vpc-connector"
```

### 3. 配置替换变量
编辑 `cloudbuild.yaml` 中的 `substitutions` 部分：
```yaml
substitutions:
  _CLOUD_SQL_INSTANCE: 'YOUR_PROJECT_ID:asia-east1:solar-system-db'
  _VPC_CONNECTOR: 'projects/YOUR_PROJECT_ID/locations/asia-east1/connectors/solar-vpc-connector'
```

---

## 📊 监控和日志

### 1. 查看日志
```bash
# 查看 Cloud Run 日志
gcloud run services logs read solar-system-app \
  --region=asia-east1 \
  --limit=50

# 实时日志流
gcloud run services logs tail solar-system-app \
  --region=asia-east1
```

### 2. 设置告警
在 Cloud Console 中配置:
1. **Monitoring** → **Alerting** → **Create Policy**
2. 配置指标:
   - CPU 使用率 > 80%
   - 内存使用率 > 80%
   - 请求错误率 > 5%
   - 请求延迟 > 2s

### 3. 性能监控
```bash
# 查看服务指标
gcloud run services describe solar-system-app \
  --region=asia-east1 \
  --format="table(status.conditions)"
```

---

## 🔧 数据迁移

### 从 SQLite 迁移到 MySQL
```bash
# 1. 安装依赖
npm install

# 2. 配置 .env.production 文件
# 确保 DB_HOST, DB_PASSWORD 等配置正确

# 3. 运行迁移脚本
npm run migrate:mysql

# 4. 验证迁移结果
# 脚本会自动显示迁移统计信息
```

---

## 🛠️ 故障排除

### 常见问题

**1. Cloud SQL 连接失败**
```bash
# 检查 Cloud SQL 实例状态
gcloud sql instances describe solar-system-db

# 检查 VPC Connector
gcloud compute networks vpc-access connectors describe solar-vpc-connector \
  --region=asia-east1

# 测试连接
gcloud sql connect solar-system-db --user=solar_app_user
```

**2. Secret Manager 权限错误**
```bash
# 检查服务账户权限
gcloud secrets get-iam-policy session-secret

# 重新授权
gcloud secrets add-iam-policy-binding session-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**3. 内存不足错误**
```bash
# 增加 Cloud Run 内存限制
gcloud run services update solar-system-app \
  --memory=1Gi \
  --region=asia-east1
```

**4. 查看详细错误日志**
```bash
# 查看最近的错误
gcloud run services logs read solar-system-app \
  --region=asia-east1 \
  --format="table(timestamp,severity,textPayload)" \
  --filter="severity>=ERROR"
```

---

## 📈 性能优化建议

### 1. 数据库优化
- 启用 Query Insights
- 配置连接池大小
- 添加适当的索引
- 启用慢查询日志

### 2. Cloud Run 优化
- 设置最小实例数避免冷启动
- 调整并发设置
- 使用 Cloud CDN 缓存静态资源

### 3. 成本优化
- 使用自动缩放
- 设置最大实例数限制
- 监控资源使用情况
- 定期清理未使用的资源

---

## 📝 环境变量检查清单

部署前确保配置以下环境变量:

- [ ] `NODE_ENV=production`
- [ ] `GCP_PROJECT_ID`
- [ ] `USE_SECRET_MANAGER=true`
- [ ] `DB_HOST` (Cloud SQL 连接名称)
- [ ] `DB_NAME=solar_system_db`
- [ ] `DB_USER=solar_app_user`
- [ ] `FRONTEND_URL` (前端域名)
- [ ] `ALLOWED_ORIGINS` (CORS 配置)

Secret Manager 中的密钥:
- [ ] `session-secret`
- [ ] `db-password`
- [ ] `smtp-password` (如需邮件功能)
- [ ] `sms-api-key` (如需短信功能)

---

## 🎉 部署完成

部署成功后，您的应用将在以下地址可用:
- **API**: `https://solar-system-app-xxxxxxxx-xx.a.run.app`
- **健康检查**: `https://your-url/api/health`

记得更新前端的 API 端点配置！

---

## 📞 支持和帮助

- [Google Cloud Run 文档](https://cloud.google.com/run/docs)
- [Cloud SQL 文档](https://cloud.google.com/sql/docs)
- [Secret Manager 文档](https://cloud.google.com/secret-manager/docs)
- [Cloud Build 文档](https://cloud.google.com/build/docs)
