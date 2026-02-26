/**
 * SQLite 到 MySQL 数据迁移脚本
 * 用于将现有 SQLite 数据迁移到 Cloud SQL (MySQL)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getPool } = require('./db-mysql');

// SQLite 数据库路径
const SQLITE_DB_PATH = path.join(__dirname, 'users.db');

/**
 * 从 SQLite 读取所有用户数据
 */
function readSQLiteUsers() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });

    db.all('SELECT * FROM users', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      db.close();
      resolve(rows || []);
    });
  });
}

/**
 * 从 SQLite 读取所有验证码数据
 */
function readSQLiteVerificationCodes() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
    });

    db.all('SELECT * FROM verification_codes', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      db.close();
      resolve(rows || []);
    });
  });
}

/**
 * 将用户数据迁移到 MySQL
 */
async function migrateUsers(users) {
  const pool = getPool();
  let migratedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    try {
      await pool.execute(
        `INSERT INTO users 
        (username, email, phone, password_hash, security_question, 
         security_answer_hash, email_verified, phone_verified, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.username,
          user.email,
          user.phone,
          user.password_hash,
          user.security_question,
          user.security_answer_hash,
          user.email_verified || 0,
          user.phone_verified || 0,
          user.created_at,
          user.updated_at || user.created_at
        ]
      );
      migratedCount++;
      console.log(`✅ Migrated user: ${user.username}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        skippedCount++;
        console.log(`⚠️  Skipped duplicate user: ${user.username}`);
      } else {
        console.error(`❌ Failed to migrate user ${user.username}:`, error.message);
      }
    }
  }

  return { migratedCount, skippedCount };
}

/**
 * 将验证码数据迁移到 MySQL
 */
async function migrateVerificationCodes(codes) {
  const pool = getPool();
  let migratedCount = 0;

  for (const code of codes) {
    try {
      await pool.execute(
        `INSERT INTO verification_codes 
        (type, target, code, purpose, expires_at, used, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          code.type,
          code.target,
          code.code,
          code.purpose,
          code.expires_at,
          code.used || 0,
          code.created_at
        ]
      );
      migratedCount++;
    } catch (error) {
      console.error(`❌ Failed to migrate verification code:`, error.message);
    }
  }

  return migratedCount;
}

/**
 * 执行完整迁移
 */
async function runMigration() {
  console.log('========================================');
  console.log('🔄 Starting SQLite to MySQL migration');
  console.log('========================================');

  try {
    // 读取 SQLite 数据
    console.log('\n📖 Reading SQLite database...');
    const users = await readSQLiteUsers();
    const codes = await readSQLiteVerificationCodes();

    console.log(`Found ${users.length} users`);
    console.log(`Found ${codes.length} verification codes`);

    // 迁移用户数据
    console.log('\n👥 Migrating users...');
    const userResults = await migrateUsers(users);
    console.log(`✅ Migrated ${userResults.migratedCount} users`);
    console.log(`⚠️  Skipped ${userResults.skippedCount} duplicate users`);

    // 迁移验证码数据
    console.log('\n🔑 Migrating verification codes...');
    const codeCount = await migrateVerificationCodes(codes);
    console.log(`✅ Migrated ${codeCount} verification codes`);

    console.log('\n========================================');
    console.log('✅ Migration completed successfully!');
    console.log('========================================');

    return {
      success: true,
      users: userResults,
      codes: codeCount
    };
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * 验证迁移结果
 */
async function verifyMigration() {
  const pool = getPool();

  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [codeCount] = await pool.execute('SELECT COUNT(*) as count FROM verification_codes');

    console.log('\n📊 Migration verification:');
    console.log(`   Users in MySQL: ${userCount[0].count}`);
    console.log(`   Verification codes in MySQL: ${codeCount[0].count}`);

    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const { createPool, closePool } = require('./db-mysql');
  
  (async () => {
    try {
      // 初始化 MySQL 连接
      await createPool();
      
      // 运行迁移
      await runMigration();
      
      // 验证迁移
      await verifyMigration();
      
      // 关闭连接
      await closePool();
      
      process.exit(0);
    } catch (error) {
      console.error('Migration script failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  runMigration,
  verifyMigration
};
