const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// ✅ 优化: 使用优化后的路由
const authRoutes = require('./routes/auth_optimized');
const earthRoutes = require('./routes/earth_optimized');

// 导入配置
const config = require('./config/environment');

// ✅ 优化: 使用统一数据库接口
const database = require('./database');
const VerificationCodeService = require('./services/VerificationCodeService');

// 导入安全中间件
const {
  configureHelmet,
  createGlobalRateLimiter,
  createAuthRateLimiter,
  createVerificationRateLimiter,
  configureMongoSanitize,
  configureXssClean,
  configureHpp,
  forceHttps,
  securityLogger,
  configureSizeLimit
} = require('./middleware/security');

// ✅ 优化: 导入监控中间件
const {
  requestLogger,
  performanceMonitor,
  statsCollector,
  errorTracker,
  getHealthMetrics,
  getPerformanceMetrics
} = require('./middleware/monitoring');

const app = express();

// 异步初始化服务器
async function initializeServer() {
  try {
    // 初始化环境配置（加载密钥）
    await config.init();

    // ✅ 优化: 初始化统一数据库层
    await database.initDatabase();

    const serverConfig = config.getServerConfig();
    const PORT = serverConfig.port;

    // ✅ 优化: 启动定时任务清理过期验证码
    setInterval(async () => {
      try {
        await VerificationCodeService.cleanupExpired();
      } catch (error) {
        console.error('清理过期验证码失败:', error);
      }
    }, 3600000); // 每小时清理一次

    // ========================================
    // 安全中间件（优先级最高）
    // ========================================
    
    // 1. 强制 HTTPS（生产环境）
    app.use(forceHttps);

    // 2. Helmet 安全头
    app.use(configureHelmet());

    // 3. 全局速率限制
    app.use(createGlobalRateLimiter(config.getRateLimitConfig()));

    // 4. 安全日志
    app.use(securityLogger);

    // ========================================
    // ✅ 优化: 监控和日志中间件
    // ========================================
    
    // 请求日志
    app.use(requestLogger());
    
    // 性能监控
    app.use(performanceMonitor({ slowThreshold: 1000 }));
    
    // 统计收集
    app.use(statsCollector());

    // ========================================
    // 基础中间件
    // ========================================
    
    // CORS 配置
    app.use(cors(config.getCorsConfig()));

    // 请求体解析（带大小限制）
    const sizeLimit = configureSizeLimit();
    app.use(express.json(sizeLimit.json));
    app.use(express.urlencoded(sizeLimit.urlencoded));

    // NoSQL 注入防护
    app.use(configureMongoSanitize());

    // XSS 防护
    app.use(configureXssClean());

    // HTTP 参数污染防护
    app.use(configureHpp());

    // Session 配置
    const sessionConfig = config.getSessionConfig();
    
    // ✅ 优化: 根据环境选择Session存储
    if (database.isMySQL) {
      const { createSessionStore } = require('./config/session-store');
      const sessionStore = createSessionStore();
      if (sessionStore) {
        sessionConfig.store = sessionStore;
        console.log('📦 Session Store: MySQL');
      }
    } else {
      console.log('📦 Session Store: Memory (development only)');
    }
    
    app.use(session(sessionConfig));

    // ========================================
    // 静态文件服务
    // ========================================
    app.use(express.static(path.join(__dirname, '../dist'), {
      maxAge: serverConfig.isProduction ? '1d' : 0, // 生产环境缓存1天
      etag: true,
      lastModified: true,
      index: 'index.html' // 默认首页
    }));

    // 根路径重定向到 index.html（备用方案）
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });

    // ========================================
    // API 路由（带特定速率限制）
    // ========================================
    
    // 认证路由（严格限制）
    app.use('/api/auth/login', createAuthRateLimiter());
    app.use('/api/auth/register', createAuthRateLimiter());
    app.use('/api/auth/send-verification', createVerificationRateLimiter());
    app.use('/api/auth', authRoutes);
    
    // 其他路由
    app.use('/api/earth', earthRoutes);

    // ========================================
    // 健康检查和监控
    // ========================================
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        message: 'Server is running',
        environment: serverConfig.env,
        timestamp: new Date().toISOString(),
        metrics: getHealthMetrics()
      });
    });

    // 就绪检查（用于 Kubernetes/Cloud Run）
    app.get('/api/ready', async (req, res) => {
      res.json({ 
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    });

    // ✅ 优化: 性能统计端点 (仅开发环境或管理员)
    app.get('/api/metrics', (req, res) => {
      // TODO: 添加管理员权限检查
      res.json({
        success: true,
        metrics: getPerformanceMetrics()
      });
    });

    // ========================================
    // 错误处理中间件
    // ========================================
    
    // ✅ 优化: 错误追踪
    app.use(errorTracker());
    
    // 404 处理
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: '请求的资源不存在'
      });
    });

    // 全局错误处理
    app.use((err, req, res, next) => {
      console.error('❌ Server error:', err);

      // CORS 错误
      if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
          success: false,
          message: '跨域请求被拒绝'
        });
      }

      // 开发环境返回详细错误
      const errorResponse = {
        success: false,
        message: serverConfig.isDevelopment ? err.message : '服务器内部错误'
      };

      if (serverConfig.isDevelopment) {
        errorResponse.stack = err.stack;
      }

      res.status(err.status || 500).json(errorResponse);
    });

    // ========================================
    // 启动服务器
    // ========================================
    const server = app.listen(PORT, () => {
      console.log('========================================');
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 Environment: ${serverConfig.env}`);
      console.log(`🔒 Security: Enhanced`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log('========================================');
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        console.log('✅ HTTP server closed');
        // ✅ 优化: 使用统一数据库关闭接口
        await database.closeDatabase();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n⚠️  SIGINT signal received: closing HTTP server');
      server.close(async () => {
        console.log('✅ HTTP server closed');
        // ✅ 优化: 使用统一数据库关闭接口
        await database.closeDatabase();
        process.exit(0);
      });
    });

    return server;

  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// 启动服务器
initializeServer();

module.exports = app;
