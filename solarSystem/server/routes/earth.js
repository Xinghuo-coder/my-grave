/**
 * 地球热点区域API路由
 */
const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * 初始化热点数据表
 */
function initHotspotTable() {
  const sql = `
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
  `;
  
  db.run(sql, (err) => {
    if (err) {
      console.error('创建热点表失败:', err);
    } else {
      console.log('✅ 热点表已创建');
    }
  });
  
  // 创建索引以提高查询性能
  const indexSql = `
    CREATE INDEX IF NOT EXISTS idx_hotspot_id ON earth_hotspots(id);
    CREATE INDEX IF NOT EXISTS idx_hotspot_user ON earth_hotspots(user_id);
  `;
  
  db.exec(indexSql, (err) => {
    if (err) {
      console.error('创建索引失败:', err);
    }
  });
}

// 初始化表
initHotspotTable();

/**
 * 保存热点信息
 */
router.post('/save-hotspot', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '请先登录' });
  }
  
  const { id, lat, lon, latRange, lonRange, note } = req.body;
  const userId = req.session.user.id;
  
  // 检查热点是否已存在
  const checkSql = 'SELECT * FROM earth_hotspots WHERE id = ? AND user_id = ?';
  
  db.get(checkSql, [id, userId], (err, row) => {
    if (err) {
      console.error('查询热点失败:', err);
      return res.json({ success: false, message: '查询失败' });
    }
    
    if (row) {
      // 更新已存在的热点
      const updateSql = `
        UPDATE earth_hotspots 
        SET note = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
      
      db.run(updateSql, [note || '', id, userId], function(err) {
        if (err) {
          console.error('更新热点失败:', err);
          return res.json({ success: false, message: '更新失败' });
        }
        
        res.json({ 
          success: true, 
          message: '热点信息已更新',
          hotspotId: id
        });
      });
    } else {
      // 插入新热点
      const insertSql = `
        INSERT INTO earth_hotspots 
        (id, lat, lon, lat_range_min, lat_range_max, lon_range_min, lon_range_max, user_id, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(insertSql, [
        id, 
        lat, 
        lon, 
        latRange.min, 
        latRange.max, 
        lonRange.min, 
        lonRange.max,
        userId,
        note || ''
      ], function(err) {
        if (err) {
          console.error('保存热点失败:', err);
          return res.json({ success: false, message: '保存失败' });
        }
        
        res.json({ 
          success: true, 
          message: '热点信息已保存',
          hotspotId: id
        });
      });
    }
  });
});

/**
 * 获取用户保存的热点列表
 */
router.get('/my-hotspots', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '请先登录' });
  }
  
  const userId = req.session.user.id;
  const sql = `
    SELECT * FROM earth_hotspots 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error('查询热点列表失败:', err);
      return res.json({ success: false, message: '查询失败' });
    }
    
    res.json({ 
      success: true, 
      hotspots: rows 
    });
  });
});

/**
 * 获取特定热点详情
 */
router.get('/hotspot/:id', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '请先登录' });
  }
  
  const hotspotId = req.params.id;
  const userId = req.session.user.id;
  
  const sql = 'SELECT * FROM earth_hotspots WHERE id = ? AND user_id = ?';
  
  db.get(sql, [hotspotId, userId], (err, row) => {
    if (err) {
      console.error('查询热点详情失败:', err);
      return res.json({ success: false, message: '查询失败' });
    }
    
    if (!row) {
      return res.json({ success: false, message: '热点不存在' });
    }
    
    res.json({ 
      success: true, 
      hotspot: row 
    });
  });
});

/**
 * 删除热点
 */
router.delete('/hotspot/:id', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '请先登录' });
  }
  
  const hotspotId = req.params.id;
  const userId = req.session.user.id;
  
  const sql = 'DELETE FROM earth_hotspots WHERE id = ? AND user_id = ?';
  
  db.run(sql, [hotspotId, userId], function(err) {
    if (err) {
      console.error('删除热点失败:', err);
      return res.json({ success: false, message: '删除失败' });
    }
    
    if (this.changes === 0) {
      return res.json({ success: false, message: '热点不存在' });
    }
    
    res.json({ 
      success: true, 
      message: '热点已删除' 
    });
  });
});

/**
 * 获取热点统计信息
 */
router.get('/statistics', (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, message: '请先登录' });
  }
  
  const userId = req.session.user.id;
  
  const sql = `
    SELECT 
      COUNT(*) as total_saved,
      MIN(created_at) as first_saved,
      MAX(updated_at) as last_updated
    FROM earth_hotspots 
    WHERE user_id = ?
  `;
  
  db.get(sql, [userId], (err, row) => {
    if (err) {
      console.error('查询统计信息失败:', err);
      return res.json({ success: false, message: '查询失败' });
    }
    
    res.json({ 
      success: true, 
      statistics: row 
    });
  });
});

module.exports = router;
