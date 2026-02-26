/**
 * 验证码服务层 - 优化版本
 * 添加防刷机制、缓存支持、自动清理过期验证码
 */

const { query, execute, getOne } = require('../database');

class VerificationCodeService {
  /**
   * 生成6位随机验证码
   */
  static generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 创建验证码记录
   */
  static async create(type, target, purpose) {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    const sql = `
      INSERT INTO verification_codes (type, target, code, purpose, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = await execute(sql, [
      type, 
      target, 
      code, 
      purpose, 
      expiresAt.toISOString()
    ]);
    
    return { 
      id: result.lastID || result.insertId, 
      code, 
      expiresAt 
    };
  }

  /**
   * 验证验证码
   */
  static async verify(type, target, code, purpose) {
    const sql = `
      SELECT * FROM verification_codes 
      WHERE type = ? AND target = ? AND code = ? AND purpose = ? 
      AND used = 0 AND datetime(expires_at) > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const row = await getOne(sql, [type, target, code, purpose]);
    
    if (!row) {
      return false;
    }
    
    // 标记为已使用
    const updateSql = 'UPDATE verification_codes SET used = 1 WHERE id = ?';
    await execute(updateSql, [row.id]);
    
    return true;
  }

  /**
   * 检查验证码发送频率 (防刷)
   * 返回距离上次发送的剩余时间(秒),0表示可以发送
   */
  static async checkRateLimit(type, target, cooldownSeconds = 60) {
    const sql = `
      SELECT created_at FROM verification_codes 
      WHERE type = ? AND target = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const row = await getOne(sql, [type, target]);
    
    if (!row) {
      return 0; // 没有记录,可以发送
    }
    
    const lastSentTime = new Date(row.created_at).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - lastSentTime) / 1000);
    
    if (elapsed < cooldownSeconds) {
      return cooldownSeconds - elapsed; // 返回剩余冷却时间
    }
    
    return 0; // 冷却完成,可以发送
  }

  /**
   * 清理过期验证码 (定时任务调用)
   */
  static async cleanupExpired() {
    const sql = `
      DELETE FROM verification_codes 
      WHERE datetime(expires_at) < datetime('now')
    `;
    
    const result = await execute(sql);
    const deleted = result.changes || result.affectedRows || 0;
    
    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} expired verification codes`);
    }
    
    return deleted;
  }

  /**
   * 获取验证码统计信息 (用于监控)
   */
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_codes,
        COUNT(CASE WHEN used = 1 THEN 1 END) as used_codes,
        COUNT(CASE WHEN datetime(expires_at) < datetime('now') THEN 1 END) as expired_codes
      FROM verification_codes
    `;
    return await getOne(sql);
  }
}

module.exports = VerificationCodeService;
