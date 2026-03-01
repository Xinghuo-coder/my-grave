/**
 * 地球热点服务层 - TypeScript版本
 * 封装所有热点相关的数据库操作
 * 使用 async/await,支持 MySQL 和 SQLite
 */

// TODO: 需要将database模块迁移到TypeScript
const { query, execute, getOne } = require('../database');

/**
 * 热点数据接口
 */
export interface HotspotData {
  id: string;
  lat: number;
  lon: number;
  latRange: {
    min: number;
    max: number;
  };
  lonRange: {
    min: number;
    max: number;
  };
  note?: string;
}

/**
 * 热点统计信息
 */
export interface HotspotStats {
  total_hotspots: number;
  users_with_hotspots: number;
  new_hotspots_week: number;
}

class HotspotService {
  /**
   * 保存或更新热点信息
   */
  static async saveHotspot(userId: number, hotspotData: HotspotData): Promise<{ id: string; action: 'created' | 'updated' }> {
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
  static async getUserHotspots(userId: number): Promise<any[]> {
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
  static async getHotspotById(hotspotId: string, userId: number): Promise<any | null> {
    const sql = 'SELECT * FROM earth_hotspots WHERE id = ? AND user_id = ?';
    return await getOne(sql, [hotspotId, userId]);
  }

  /**
   * 删除热点
   */
  static async deleteHotspot(hotspotId: string, userId: number): Promise<boolean> {
    const sql = 'DELETE FROM earth_hotspots WHERE id = ? AND user_id = ?';
    const result = await execute(sql, [hotspotId, userId]);
    return (result.changes || result.affectedRows || 0) > 0;
  }

  /**
   * 获取用户热点数量
   */
  static async getUserHotspotCount(userId: number): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM earth_hotspots WHERE user_id = ?';
    const row = await getOne(sql, [userId]);
    return row ? row.count : 0;
  }

  /**
   * 获取热点统计信息 (用于监控)
   */
  static async getStats(): Promise<HotspotStats> {
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
  static async getHotspotsInRange(
    userId: number, 
    latMin: number, 
    latMax: number, 
    lonMin: number, 
    lonMax: number
  ): Promise<any[]> {
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

export default HotspotService;
