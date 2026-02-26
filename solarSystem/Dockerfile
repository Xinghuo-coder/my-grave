# ========================================
# Multi-stage Dockerfile for Solar System App
# 优化的生产环境镜像构建
# ========================================

# ========================================
# Stage 1: 构建前端资源
# ========================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码和配置
COPY config ./config
COPY src ./src
COPY solarSystem ./solarSystem

# 构建前端资源
RUN npm run build

# ========================================
# Stage 2: 生产环境运行时
# ========================================
FROM node:18-alpine AS production

# 安装生产环境必要的系统依赖
RUN apk add --no-cache \
    tini \
    dumb-init

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=frontend-builder /app/dist ./dist

# 复制服务器代码
COPY server ./server

# 复制环境配置示例（实际密钥通过环境变量注入）
COPY .env.example ./.env.example

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 使用 tini 作为初始化进程
ENTRYPOINT ["/sbin/tini", "--"]

# 启动应用
CMD ["node", "server/index.js"]
