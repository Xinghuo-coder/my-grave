/**
 * 安全中间件配置
 * 包括 Helmet、速率限制、CSRF 保护等
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * 配置 Helmet 安全头
 */
function configureHelmet() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // 开发环境使用宽松的 CSP，生产环境使用严格的 CSP
  if (isDevelopment) {
    return helmet({
      contentSecurityPolicy: false, // 开发环境完全禁用 CSP 以便调试
      hsts: false,
      referrerPolicy: { policy: 'no-referrer-when-downgrade' }
    });
  }
  
  // 生产环境严格的 CSP
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1年
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
    frameguard: { action: 'deny' }
  });
}

/**
 * 全局速率限制
 */
function createGlobalRateLimiter(config) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: config.standardHeaders,
    legacyHeaders: config.legacyHeaders,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    }
  });
}

/**
 * 认证相关接口的严格速率限制
 */
function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5次尝试
    skipSuccessfulRequests: true, // 成功的请求不计数
    message: '登录尝试次数过多，请15分钟后再试',
    handler: (req, res) => {
      console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message: '登录尝试次数过多，请15分钟后再试'
      });
    }
  });
}

/**
 * 验证码发送的速率限制
 */
function createVerificationRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1分钟
    max: 1, // 1分钟内最多1次
    message: '验证码发送过于频繁，请稍后再试',
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: '验证码发送过于频繁，请1分钟后再试'
      });
    }
  });
}

/**
 * NoSQL 注入防护
 */
function configureMongoSanitize() {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`⚠️  Sanitized key: ${key} in request from ${req.ip}`);
    }
  });
}

/**
 * XSS 防护
 */
function configureXssClean() {
  return xss();
}

/**
 * HTTP 参数污染防护
 */
function configureHpp() {
  return hpp({
    whitelist: ['sort', 'filter'] // 允许重复的参数
  });
}

/**
 * 强制 HTTPS 重定向（生产环境）
 */
function forceHttps(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    // 检查是否来自负载均衡器的 HTTPS 请求
    const isHttps = req.secure || 
                    req.headers['x-forwarded-proto'] === 'https' ||
                    req.headers['x-forwarded-ssl'] === 'on';
    
    if (!isHttps) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
}

/**
 * 安全日志中间件
 */
function securityLogger(req, res, next) {
  const logData = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent')
  };

  // 记录敏感操作
  if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
    console.log('🔒 Security log:', JSON.stringify(logData));
  }

  next();
}

/**
 * 请求体大小限制
 */
function configureSizeLimit() {
  return {
    json: { limit: '10kb' }, // JSON 请求体限制
    urlencoded: { limit: '10kb', extended: true } // URL 编码请求体限制
  };
}

module.exports = {
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
};
