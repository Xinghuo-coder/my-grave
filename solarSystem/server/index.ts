import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';

// 导入路由
import authRoutes from './routes/auth_optimized';
import earthRoutes from './routes/earth_optimized';

// 导入配置和数据库
import config from './config/environment';
import database from './database';
import VerificationCodeService from './services/VerificationCodeService';

// 导入安全中间件
import {
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
} from './middleware/security';

// 导入监控中间件
import {
  requestLogger,
  performanceMonitor,
  statsCollector,
  errorTracker,
  getHealthMetrics,
  getPerformanceMetrics
} from './middleware/monitoring';

const app: Express = express();

/**
 * 异步初始化服务器
 */
async function initializeServer(): Promise<void> {
  try {
    // 初始化环境配置（加载密钥）
    await config.init();

    // 初始化统一数据库层
    await database.initDatabase();

    // ✅ 安全配置
    configureHelmet(app);
    configureMongoSanitize(app);
    configureXssClean(app);
    configureHpp(app);
    configureSizeLimit(app);

    // ✅ 监控配置
    app.use(securityLogger);
    app.use(requestLogger);
    app.use(performanceMonitor);
    app.use(statsCollector);
    app.use(errorTracker);

    // ✅ 基础中间件配置
    const corsOptions = {
      origin: process.env.CORS_ORIGIN || 'http://localhost:8095',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400
    };

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Session 配置
    const sessionStore = await require('./config/session-store')(session);

    app.use(session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'default-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
      }
    }));

    // ✅ 速率限制
    const globalLimiter = createGlobalRateLimiter();
    const authLimiter = createAuthRateLimiter();
    const verificationLimiter = createVerificationRateLimiter();

    app.use(globalLimiter);

    // ✅ 生产环境强制HTTPS
    if (process.env.NODE_ENV === 'production') {
      app.use(forceHttps);
    }

    // ✅ 健康检查端点
    app.get('/api/health', (req: Request, res: Response) => {
      const metrics = getHealthMetrics();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        metrics
      });
    });

    // ✅ 性能指标端点（仅开发环境）
    if (process.env.NODE_ENV !== 'production') {
      app.get('/api/performance', (req: Request, res: Response) => {
        const metrics = getPerformanceMetrics();
        res.json(metrics);
      });
    }

    // ✅ 路由挂载
    app.use('/api/auth', authLimiter, authRoutes);
    app.use('/api/earth', earthRoutes);

    // ✅ 静态文件服务
    app.use(express.static(path.join(__dirname, '../dist')));

    // ✅ SPA 路由回退
    app.get(/^(?!.*\.(js|css|json|png|jpg|jpeg|gif|svg|ico)).*$/, (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    });

    // ✅ 全局错误处理中间件
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);

      const status = err.status || err.statusCode || 500;
      const message = err.message || 'Internal Server Error';

      res.status(status).json({
        success: false,
        status,
        message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });

    // ✅ 404 处理
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        status: 404,
        message: 'Not Found',
        path: req.path
      });
    });

    // ✅ 服务器启动
    const port = parseInt(process.env.PORT || '3000', 10);
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`
        ✅ Server is running
        📡 Port: ${port}
        🌍 Environment: ${process.env.NODE_ENV || 'development'}
        🔐 Database: ${process.env.DB_TYPE || 'sqlite3'}
        ⏰ Started at: ${new Date().toISOString()}
      `);
    });

    // ✅ 优雅关闭
    process.on('SIGTERM', async () => {
      console.log('📬 SIGTERM received, shutting down gracefully');
      server.close(async () => {
        try {
          await database.closeDatabase();
          console.log('✅ Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error closing database:', error);
          process.exit(1);
        }
      });
    });

  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// 启动服务器
initializeServer();

export default app;
