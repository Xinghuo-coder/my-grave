/**
 * 用户服务层 - 封装所有用户相关的数据库操作
 * 使用 async/await 替代回调,支持 MySQL 和 SQLite
 */

const bcrypt = require('bcrypt');
const { query, execute, getOne } = require('../database');

// 优化: 从 10 降到 8,性能提升 4 倍,安全性仍足够
const SALT_ROUNDS = 8;

class UserService {
  /**
   * 创建新用户
   */
  static async create(userData) {
    const { username, email, phone, password, securityQuestion, securityAnswer } = userData;
    
    // 加密密码和安全问题答案
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase(), SALT_ROUNDS);

    const sql = `
      INSERT INTO users (username, email, phone, password_hash, security_question, security_answer_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await execute(sql, [
      username, 
      email, 
      phone, 
      passwordHash, 
      securityQuestion, 
      securityAnswerHash
    ]);
    
    return {
      id: result.lastID || result.insertId,
      username,
      email,
      phone
    };
  }

  /**
   * 通过用户名查找用户
   */
  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    return await getOne(sql, [username]);
  }

  /**
   * 通过邮箱查找用户
   */
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return await getOne(sql, [email]);
  }

  /**
   * 通过手机号查找用户
   */
  static async findByPhone(phone) {
    const sql = 'SELECT * FROM users WHERE phone = ?';
    return await getOne(sql, [phone]);
  }

  /**
   * 通过ID查找用户
   */
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    return await getOne(sql, [id]);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * 验证安全问题答案
   */
  static async verifySecurityAnswer(answer, hash) {
    return await bcrypt.compare(answer.toLowerCase(), hash);
  }

  /**
   * 更新密码
   */
  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    const sql = `
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await execute(sql, [passwordHash, userId]);
    return result.changes > 0 || result.affectedRows > 0;
  }

  /**
   * 更新验证状态
   */
  static async updateVerificationStatus(userId, type, verified) {
    const column = type === 'email' ? 'email_verified' : 'phone_verified';
    const sql = `
      UPDATE users 
      SET ${column} = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await execute(sql, [verified ? 1 : 0, userId]);
    return result.changes > 0 || result.affectedRows > 0;
  }

  /**
   * 获取用户统计信息 (用于监控)
   */
  static async getUserStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_verified = 1 THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_users_week
      FROM users
    `;
    return await getOne(sql);
  }
}

module.exports = UserService;
