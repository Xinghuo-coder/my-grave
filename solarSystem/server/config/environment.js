/**
 * 环境配置管理
 * 统一管理不同环境的配置
 */

require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env'
});

const secretsManager = require('./secrets');

class EnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.secrets = null;
  }

  /**
   * 初始化配置（加载密钥）
   */
  async init() {
    try {
      await secretsManager.init();
      this.secrets = await secretsManager.getAllSecrets();
      console.log(`✅ Environment configured for: ${this.env}`);
    } catch (error) {
      console.error('❌ Failed to initialize environment config:', error);
      throw error;
    }
  }

  /**
   * 获取服务器配置
   */
  getServerConfig() {
    return {
      port: parseInt(process.env.PORT) || 3000,
      env: this.env,
      isDevelopment: this.env === 'development',
      isProduction: this.env === 'production'
    };
  }

  /**
   * 获取数据库配置
   */
  getDatabaseConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      database: process.env.DB_NAME || 'solar_system_db',
      user: process.env.DB_USER || 'root',
      password: this.secrets?.dbPassword || process.env.DB_PASSWORD || '',
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
      // Cloud SQL 特定配置
      socketPath: process.env.DB_HOST?.startsWith('/cloudsql/') 
        ? process.env.DB_HOST 
        : undefined,
      ssl: this.env === 'production' ? {
        rejectUnauthorized: true
      } : undefined
    };
  }

  /**
   * 获取 Session 配置
   */
  getSessionConfig() {
    const isProduction = this.env === 'production';
    
    return {
      secret: this.secrets?.sessionSecret || process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      name: 'solar.sid', // 自定义 session cookie 名称
      cookie: {
        secure: isProduction, // 生产环境强制 HTTPS
        httpOnly: true, // 防止 XSS
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        sameSite: isProduction ? 'strict' : 'lax', // CSRF 保护
        domain: process.env.COOKIE_DOMAIN || undefined
      },
      proxy: isProduction // 信任代理（Cloud Run/Load Balancer）
    };
  }

  /**
   * 获取 CORS 配置
   */
  getCorsConfig() {
    const isDevelopment = this.env === 'development';
    
    // 开发环境允许所有本地地址
    if (isDevelopment) {
      return {
        origin: true, // 允许所有来源
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      };
    }
    
    // 生产环境严格限制
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [process.env.FRONTEND_URL || 'http://localhost:8095'];

    return {
      origin: (origin, callback) => {
        // 允许无 origin 的请求（如移动应用、Postman）
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    };
  }

  /**
   * 获取速率限制配置
   */
  getRateLimitConfig() {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: '请求过于频繁，请稍后再试',
      standardHeaders: true,
      legacyHeaders: false
    };
  }

  /**
   * 获取 SMTP 配置
   */
  getSmtpConfig() {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: this.secrets?.smtpPassword || process.env.SMTP_PASS
      }
    };
  }

  /**
   * 获取短信服务配置
   */
  getSmsConfig() {
    return {
      provider: process.env.SMS_PROVIDER || 'twilio',
      accountSid: process.env.SMS_ACCOUNT_SID,
      authToken: this.secrets?.smsApiKey || process.env.SMS_AUTH_TOKEN,
      fromNumber: process.env.SMS_FROM_NUMBER
    };
  }

  /**
   * 获取日志配置
   */
  getLoggingConfig() {
    return {
      level: process.env.LOG_LEVEL || 'info',
      enableCloudLogging: process.env.ENABLE_CLOUD_LOGGING === 'true'
    };
  }
}

// 导出单例
const config = new EnvironmentConfig();

module.exports = config;
