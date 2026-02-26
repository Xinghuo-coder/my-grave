/**
 * 性能监控和日志中间件
 * 用于监控API性能、慢查询、错误追踪
 */

const responseTime = require('response-time');
const morgan = require('morgan');

/**
 * 请求日志中间件 (开发环境详细,生产环境简洁)
 */
function requestLogger() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment) {
    // 开发环境: 详细日志
    return morgan('dev');
  } else {
    // 生产环境: combined格式,适合日志分析工具
    return morgan('combined');
  }
}

/**
 * 响应时间监控中间件
 */
function performanceMonitor(options = {}) {
  const { slowThreshold = 1000 } = options;
  
  return responseTime((req, res, time) => {
    // 记录所有请求的响应时间
    const timeMs = time.toFixed(2);
    
    // 慢查询告警
    if (time > slowThreshold) {
      console.warn(`⚠️ SLOW REQUEST [${timeMs}ms]: ${req.method} ${req.url}`);
    }
    
    // 添加响应头 (用于客户端性能分析)
    res.setHeader('X-Response-Time', `${timeMs}ms`);
  });
}

/**
 * API性能统计
 */
class PerformanceStats {
  constructor() {
    this.stats = new Map();
    this.resetInterval = setInterval(() => this.reset(), 60000); // 每分钟重置
  }

  record(endpoint, duration) {
    if (!this.stats.has(endpoint)) {
      this.stats.set(endpoint, {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const stat = this.stats.get(endpoint);
    stat.count++;
    stat.totalTime += duration;
    stat.maxTime = Math.max(stat.maxTime, duration);
    stat.minTime = Math.min(stat.minTime, duration);
  }

  getStats() {
    const result = {};
    for (const [endpoint, stat] of this.stats.entries()) {
      result[endpoint] = {
        ...stat,
        avgTime: stat.count > 0 ? stat.totalTime / stat.count : 0
      };
    }
    return result;
  }

  reset() {
    this.stats.clear();
  }

  destroy() {
    clearInterval(this.resetInterval);
  }
}

const performanceStats = new PerformanceStats();

/**
 * 统计中间件
 */
function statsCollector() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      performanceStats.record(endpoint, duration);
    });
    
    next();
  };
}

/**
 * 错误追踪中间件
 */
function errorTracker() {
  return (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      method: req.method,
      url: req.url,
      error: err.message,
      stack: err.stack,
      userId: req.session?.userId
    };

    // 记录错误日志
    console.error('❌ ERROR:', JSON.stringify(errorInfo, null, 2));

    // TODO: 集成 Sentry 或其他错误追踪服务
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(err);
    // }

    next(err);
  };
}

/**
 * 健康检查端点数据
 */
function getHealthMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  };
}

/**
 * 性能统计端点数据
 */
function getPerformanceMetrics() {
  return {
    apiStats: performanceStats.getStats(),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  requestLogger,
  performanceMonitor,
  statsCollector,
  errorTracker,
  getHealthMetrics,
  getPerformanceMetrics,
  performanceStats
};
