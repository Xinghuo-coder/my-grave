/**
 * Session Store - MySQL 版本
 * 使用 MySQL 存储 session 数据，支持水平扩展
 */

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { getPool } = require('../database/db-mysql');

/**
 * 创建 MySQL Session Store
 */
function createSessionStore() {
  try {
    const pool = getPool();
    
    const options = {
      clearExpired: true,
      checkExpirationInterval: 900000, // 15分钟检查一次过期 session
      expiration: 86400000, // 24小时过期
      createDatabaseTable: false, // 我们已经在 db-mysql.js 中创建了表
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      }
    };

    const sessionStore = new MySQLStore(options, pool);

    console.log('✅ MySQL Session Store initialized');
    return sessionStore;
  } catch (error) {
    console.error('❌ Failed to create MySQL Session Store:', error);
    throw error;
  }
}

module.exports = {
  createSessionStore
};
