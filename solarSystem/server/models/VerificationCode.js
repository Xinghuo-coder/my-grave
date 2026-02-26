const db = require('../database/db');

class VerificationCode {
  // 生成6位随机验证码
  static generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 创建验证码记录
  static create(type, target, purpose) {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO verification_codes (type, target, code, purpose, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [type, target, code, purpose, expiresAt.toISOString()], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, code, expiresAt });
        }
      });
    });
  }

  // 验证验证码
  static verify(type, target, code, purpose) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM verification_codes 
        WHERE type = ? AND target = ? AND code = ? AND purpose = ? 
        AND used = 0 AND datetime(expires_at) > datetime('now')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      db.get(sql, [type, target, code, purpose], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(false);
        } else {
          // 标记为已使用
          db.run('UPDATE verification_codes SET used = 1 WHERE id = ?', [row.id], (updateErr) => {
            if (updateErr) reject(updateErr);
            else resolve(true);
          });
        }
      });
    });
  }

  // 清理过期验证码
  static cleanExpired() {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM verification_codes WHERE datetime(expires_at) < datetime('now')",
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
}

module.exports = VerificationCode;
