/**
 * 验证码模型 - TypeScript版本（已弃用）
 * 注意：此文件已被 VerificationCodeService 替代
 * 保留仅为了向后兼容
 */

// TODO: 需要将database模块迁移到TypeScript
const db = require('../database/db');

class VerificationCode {
  /**
   * 生成6位随机验证码
   */
  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 创建验证码记录
   */
  static create(type: string, target: string, purpose: string): Promise<{ id: number; code: string; expiresAt: Date }> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO verification_codes (type, target, code, purpose, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [type, target, code, purpose, expiresAt.toISOString()], function(this: any, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, code, expiresAt });
        }
      });
    });
  }

  /**
   * 验证验证码
   */
  static verify(type: string, target: string, code: string, purpose: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM verification_codes 
        WHERE type = ? AND target = ? AND code = ? AND purpose = ? 
        AND used = 0 AND datetime(expires_at) > datetime('now')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      db.get(sql, [type, target, code, purpose], (err: Error | null, row: any) => {
        if (err) {
          reject(err);
        } else if (!row) {
          resolve(false);
        } else {
          // 标记为已使用
          db.run('UPDATE verification_codes SET used = 1 WHERE id = ?', [row.id], (updateErr: Error | null) => {
            if (updateErr) reject(updateErr);
            else resolve(true);
          });
        }
      });
    });
  }

  /**
   * 清理过期验证码
   */
  static cleanExpired(): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM verification_codes WHERE datetime(expires_at) < datetime('now')",
        function(this: any, err: Error | null) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
}

export default VerificationCode;
