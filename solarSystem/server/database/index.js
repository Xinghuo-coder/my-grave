/**
 * 统一数据库访问层
 * 根据环境自动选择 MySQL 或 SQLite,并提供统一的 async/await 接口
 */

const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const path = require('path');

// 判断使用哪个数据库
const isDevelopment = process.env.NODE_ENV !== 'production';
const useMySQL = process.env.USE_MYSQL === 'true' || !isDevelopment;

let db = null;

/**
 * 初始化数据库连接
 */
async function initDatabase() {
  if (useMySQL) {
    // 使用 MySQL
    const mysqlDb = require('./db-mysql');
    await mysqlDb.createPool();
    db = mysqlDb;
    console.log('📊 Database: MySQL (Production Mode)');
  } else {
    // 使用 SQLite (开发环境)
    const DB_PATH = path.join(__dirname, 'users.db');
    const sqliteDb = new sqlite3.Database(DB_PATH);
    
    // 将 SQLite callback 转换为 Promise
    db = {
      query: promisify(sqliteDb.all).bind(sqliteDb),
      run: promisify(sqliteDb.run).bind(sqliteDb),
      get: promisify(sqliteDb.get).bind(sqliteDb),
      exec: promisify(sqliteDb.exec).bind(sqliteDb),
      close: promisify(sqliteDb.close).bind(sqliteDb),
      raw: sqliteDb
    };
    
    await initSQLiteTables();
    console.log('📊 Database: SQLite (Development Mode)');
  }
  
  return db;
}

/**
 * 初始化 SQLite 表结构
 */
async function initSQLiteTables() {
  // 用户表
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      security_question VARCHAR(255) NOT NULL,
      security_answer_hash VARCHAR(255) NOT NULL,
      email_verified BOOLEAN DEFAULT 0,
      phone_verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 验证码表
  await db.run(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type VARCHAR(10) NOT NULL,
      target VARCHAR(100) NOT NULL,
      code VARCHAR(6) NOT NULL,
      purpose VARCHAR(20) NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 热点表
  await db.run(`
    CREATE TABLE IF NOT EXISTS earth_hotspots (
      id INTEGER PRIMARY KEY,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      lat_range_min REAL NOT NULL,
      lat_range_max REAL NOT NULL,
      lon_range_min REAL NOT NULL,
      lon_range_max REAL NOT NULL,
      user_id INTEGER,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建索引
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_user_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_verification_target ON verification_codes(target, expires_at);
    CREATE INDEX IF NOT EXISTS idx_hotspot_user ON earth_hotspots(user_id);
    CREATE INDEX IF NOT EXISTS idx_hotspot_user_created ON earth_hotspots(user_id, created_at);
  `);

  console.log('✅ SQLite tables and indexes initialized');
}

/**
 * 获取数据库实例
 */
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * 统一查询接口 (兼容 MySQL 和 SQLite)
 */
async function query(sql, params = []) {
  if (useMySQL) {
    const pool = db.getPool();
    const [rows] = await pool.query(sql, params);
    return rows;
  } else {
    // SQLite: query 返回所有行
    return await db.query(sql, params);
  }
}

/**
 * 统一执行接口 (INSERT/UPDATE/DELETE)
 */
async function execute(sql, params = []) {
  if (useMySQL) {
    const pool = db.getPool();
    const [result] = await pool.query(sql, params);
    return result;
  } else {
    // SQLite: run 返回 { lastID, changes }
    return await db.run(sql, params);
  }
}

/**
 * 统一获取单行接口
 */
async function getOne(sql, params = []) {
  if (useMySQL) {
    const rows = await query(sql, params);
    return rows[0] || null;
  } else {
    return await db.get(sql, params);
  }
}

/**
 * 事务支持
 */
async function transaction(callback) {
  if (useMySQL) {
    const pool = db.getPool();
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      await callback(connection);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } else {
    // SQLite 事务
    await db.run('BEGIN TRANSACTION');
    try {
      await callback(db);
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}

/**
 * 关闭数据库连接
 */
async function closeDatabase() {
  if (db) {
    if (useMySQL) {
      await db.closePool();
    } else {
      await db.close();
    }
    console.log('✅ Database connection closed');
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  query,
  execute,
  getOne,
  transaction,
  closeDatabase,
  isMySQL: useMySQL
};
