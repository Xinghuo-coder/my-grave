const bcrypt = require('bcrypt');
const db = require('../database/db');

const SALT_ROUNDS = 10;

class User {
  // 创建新用户
  static async create(userData) {
    const { username, email, phone, password, securityQuestion, securityAnswer } = userData;
    
    // 加密密码和安全问题答案
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase(), SALT_ROUNDS);

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO users (username, email, phone, password_hash, security_question, security_answer_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [username, email, phone, passwordHash, securityQuestion, securityAnswerHash], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, email, phone });
        }
      });
    });
  }

  // 通过用户名查找用户
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 通过邮箱查找用户
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 通过手机号查找用户
  static findByPhone(phone) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE phone = ?', [phone], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 通过ID查找用户
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // 验证密码
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // 验证安全问题答案
  static async verifySecurityAnswer(answer, hash) {
    return await bcrypt.compare(answer.toLowerCase(), hash);
  }

  // 更新密码
  static async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [passwordHash, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  // 更新验证状态
  static updateVerificationStatus(userId, type, verified) {
    return new Promise((resolve, reject) => {
      const column = type === 'email' ? 'email_verified' : 'phone_verified';
      db.run(
        `UPDATE users SET ${column} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [verified ? 1 : 0, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }
}

module.exports = User;
