/**
 * MySQL 数据库连接配置
 * 用于连接 Google Cloud SQL (MySQL)
 */

const mysql = require('mysql2/promise');
const config = require('../config/environment');

let pool = null;

/**
 * 创建数据库连接池
 */
async function createPool() {
  if (pool) {
    return pool;
  }

  try {
    const dbConfig = config.getDatabaseConfig();
    
    const poolConfig = {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      connectionLimit: dbConfig.connectionLimit,
      queueLimit: dbConfig.queueLimit,
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      // Cloud SQL Unix socket 连接
      ...(dbConfig.socketPath && { socketPath: dbConfig.socketPath }),
      // SSL 配置
      ...(dbConfig.ssl && { ssl: dbConfig.ssl })
    };

    pool = mysql.createPool(poolConfig);

    // 测试连接
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();

    // 初始化数据库表
    await initDatabase();

    return pool;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    throw error;
  }
}

/**
 * 获取数据库连接池
 */
function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createPool() first.');
  }
  return pool;
}

/**
 * 初始化数据库表
 */
async function initDatabase() {
  try {
    const connection = await pool.getConnection();

    // 用户表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        security_question VARCHAR(255) NOT NULL,
        security_answer_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Users table ready');

    // 验证码表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('email', 'sms') NOT NULL,
        target VARCHAR(100) NOT NULL,
        code VARCHAR(6) NOT NULL,
        purpose ENUM('register', 'login', 'reset') NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_target_code (target, code),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Verification codes table ready');

    // 地球热点数据表
    await connection.query(`
      CREATE TABLE IF NOT EXISTS earth_hotspots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_coordinates (latitude, longitude)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Earth hotspots table ready');

    // Session 表（用于持久化 session）
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
        expires INT(11) UNSIGNED NOT NULL,
        data MEDIUMTEXT COLLATE utf8mb4_bin,
        PRIMARY KEY (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Sessions table ready');

    connection.release();
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    throw error;
  }
}

/**
 * 执行查询（带错误处理）
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
}

/**
 * 执行事务
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 关闭数据库连接池
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

module.exports = {
  createPool,
  getPool,
  query,
  transaction,
  closePool
};
