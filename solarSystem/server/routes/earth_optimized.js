/**
 * 地球热点区域API路由 - 优化版本
 * 使用服务层、async/await、添加缓存支持
 */

const express = require('express');
const router = express.Router();
const HotspotService = require('../services/HotspotService');

/**
 * 保存热点信息
 */
router.post('/save-hotspot', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }
    
    const { id, lat, lon, latRange, lonRange, note } = req.body;
    const userId = req.session.user.id;
    
    if (!id || !lat || !lon || !latRange || !lonRange) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // ✅ 使用服务层保存
    const result = await HotspotService.saveHotspot(userId, {
      id,
      lat,
      lon,
      latRange,
      lonRange,
      note
    });
    
    res.json({ 
      success: true, 
      message: result.action === 'updated' ? '热点信息已更新' : '热点信息已保存',
      hotspotId: result.id
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户保存的热点列表
 */
router.get('/my-hotspots', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }
    
    const userId = req.session.user.id;
    
    // ✅ 使用服务层查询
    const hotspots = await HotspotService.getUserHotspots(userId);
    
    // ✅ 添加缓存头 (客户端可缓存60秒)
    res.set('Cache-Control', 'private, max-age=60');
    
    res.json({ 
      success: true, 
      hotspots 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取特定热点详情
 */
router.get('/hotspot/:id', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }
    
    const hotspotId = req.params.id;
    const userId = req.session.user.id;
    
    // ✅ 使用服务层查询
    const hotspot = await HotspotService.getHotspotById(hotspotId, userId);
    
    if (!hotspot) {
      return res.status(404).json({ 
        success: false, 
        message: '热点不存在' 
      });
    }
    
    res.json({ 
      success: true, 
      hotspot 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除热点
 */
router.delete('/hotspot/:id', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }
    
    const hotspotId = req.params.id;
    const userId = req.session.user.id;
    
    // ✅ 使用服务层删除
    const deleted = await HotspotService.deleteHotspot(hotspotId, userId);
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: '热点不存在或已被删除' 
      });
    }
    
    res.json({ 
      success: true, 
      message: '热点已删除' 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户热点数量
 */
router.get('/my-hotspots/count', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }
    
    const userId = req.session.user.id;
    const count = await HotspotService.getUserHotspotCount(userId);
    
    res.json({ 
      success: true, 
      count 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取范围内的热点 (用于地图渲染优化)
 */
router.post('/hotspots-in-range', async (req, res, next) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: '请先登录' 
      });
    }
    
    const userId = req.session.user.id;
    const { latMin, latMax, lonMin, lonMax } = req.body;
    
    if (latMin === undefined || latMax === undefined || 
        lonMin === undefined || lonMax === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少范围参数'
      });
    }
    
    const hotspots = await HotspotService.getHotspotsInRange(
      userId, 
      latMin, 
      latMax, 
      lonMin, 
      lonMax
    );
    
    res.json({ 
      success: true, 
      hotspots 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 监控接口 - 获取热点统计信息
 */
router.get('/stats', async (req, res, next) => {
  try {
    // TODO: 添加管理员权限检查
    const stats = await HotspotService.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
