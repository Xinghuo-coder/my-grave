/**
 * 地球热点服务层 - 封装所有热点相关的数据库操作
 * 使用 async/await,支持 MySQL 和 SQLite
 */

const { query, execute, getOne } = require('../database');

class HotspotService {
  /**
   * 保存或更新热点信息
   */
  static async saveHotspot(userId, hotspotData) {
    const { id, lat, lon, latRange, lonRange, note } = hotspotData;
    
    // 检查热点是否已存在
    const existing = await this.getHotspotById(id, userId);
    
    if (existing) {
      // 更新已存在的热点
      const sql = `
        UPDATE earth_hotspots 
        SET note = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
      
      await execute(sql, [note || '', id, userId]);
      return { id, action: 'updated' };
    } else {
      // 插入新热点
      const sql = `
        INSERT INTO earth_hotspots 
        (id, lat, lon, lat_range_min, lat_range_max, lon_range_min, lon_range_max, user_id, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await execute(sql, [
        id, 
        lat, 
        lon, 
        latRange.min, 
        latRange.max, 
        lonRange.min, 
        lonRange.max,
        userId,
        note || ''
      ]);
      
      return { id, action: 'created' };
    }
  }

  /**
   * 获取用户的所有热点列表
   */
  static async getUserHotspots(userId) {
    const sql = `
      SELECT * FROM earth_hotspots 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    
    return await query(sql, [userId]);
  }

  /**
   * 获取特定热点详情
   */
  static async getHotspotById(hotspotId, userId) {
    const sql = 'SELECT * FROM earth_hotspots WHERE id = ? AND user_id = ?';
    return await getOne(sql, [hotspotId, userId]);
  }

  /**
   * 删除热点
   */
  static async deleteHotspot(hotspotId, userId) {
    const sql = 'DELETE FROM earth_hotspots WHERE id = ? AND user_id = ?';
    const result = await execute(sql, [hotspotId, userId]);
    return (result.changes || result.affectedRows || 0) > 0;
  }

  /**
   * 获取用户热点数量
   */
  static async getUserHotspotCount(userId) {
    const sql = 'SELECT COUNT(*) as count FROM earth_hotspots WHERE user_id = ?';
    const row = await getOne(sql, [userId]);
    return row ? row.count : 0;
  }

  /**
   * 获取热点统计信息 (用于监控)
   */
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_hotspots,
        COUNT(DISTINCT user_id) as users_with_hotspots,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_hotspots_week
      FROM earth_hotspots
    `;
    return await getOne(sql);
  }

  /**
   * 批量获取热点 (用于地图渲染,可选范围过滤)
   */
  static async getHotspotsInRange(userId, latMin, latMax, lonMin, lonMax) {
    const sql = `
      SELECT * FROM earth_hotspots 
      WHERE user_id = ?
      AND lat >= ? AND lat <= ?
      AND lon >= ? AND lon <= ?
      ORDER BY created_at DESC
    `;
    
    return await query(sql, [userId, latMin, latMax, lonMin, lonMax]);
  }
}

module.exports = HotspotService;
