/**
 * 地块 API 路由定义
 * 
 * 端点说明：
 * GET  /api/blocks/:blockId         - 获取地块信息和关联的坟墓
 * GET  /api/blocks/search           - 搜索地块（按编号或位置）
 * GET  /api/blocks/available        - 获取未被占用的地块（不包括保留地块）
 * POST /api/blocks                  - 创建地块（管理员）
 * 
 * 重要：系统保留地块编号的前5%和后5%，这些地块的信息对用户查询时会被过滤
 */

import express, { Router, Request, Response } from 'express';
import type { BlockSearchRequest, GraveBlock } from '../types/block';
import { BLOCK_RANGE_CONFIG } from '../types/block';

const router = Router();

/**
 * 获取地块详情
 */
router.get('/:blockId', (req: Request, res: Response) => {
  const blockId = parseInt(req.params.blockId);

  // TODO: 实现逻辑
  // 1. 验证 blockId 是否有效
  // 2. 从数据库查询地块信息
  // 3. 检查地块是否为保留地块 - 如果是，返回错误
  // 4. 如果有关联的坟墓，获取坟墓信息（如果公开或用户有权限）
  // 5. 返回地块信息

  // 示例：检查是否为保留地块
  const isReserved = BLOCK_RANGE_CONFIG.isBlockReserved(blockId);
  if (isReserved) {
    return res.status(403).json({
      success: false,
      status: 403,
      message: '该地块为保留地块，不对用户开放',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: {
      block: null,
      grave: null,
      isAccessible: false
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 按地块编号搜索
 */
router.get('/search/byCode', (req: Request, res: Response) => {
  const blockCode = req.query.code as string;

  // TODO: 实现逻辑
  // 1. 验证地块编号格式
  // 2. 从数据库查询地块
  // 3. 检查地块是否为保留地块 - 如果是，拒绝返回
  // 4. 返回地块信息

  if (!blockCode) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: '地块编号不能为空',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: null,
    timestamp: new Date().toISOString()
  });
});

/**
 * 按位置搜索地块（圆形搜索）
 */
router.get('/search/byLocation', (req: Request, res: Response) => {
  const { latitude, longitude, radius } = req.query;

  // TODO: 实现逻辑
  // 1. 验证坐标和半径
  // 2. 使用地理位置查询（SQL中使用ST_Distance或简单的勾股定理）
  // 3. 返回搜索结果

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: '纬度和经度不能为空',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: {
      blocks: [],
      total: 0
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 获取未被占用的地块列表（不包括保留地块）
 */
router.get('/available', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // TODO: 实现逻辑
  // 1. 从数据库查询 is_occupied = false 且 is_reserved = false 的地块
  // 2. 确保只返回用户可用范围内的地块：
  //    SELECT ... WHERE is_occupied = false 
  //                 AND block_id >= ? AND block_id <= ?
  //    其中 ? 为 BLOCK_RANGE_CONFIG.getReservedRanges() 的 userMin 和 userMax
  // 3. 分页处理
  // 4. 返回地块列表

  const ranges = BLOCK_RANGE_CONFIG.getReservedRanges();
  
  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: {
      blocks: [],
      total: 0,
      page,
      limit,
      availableRange: {
        min: ranges.userMin,
        max: ranges.userMax,
        reservedInfo: `前 5% (${ranges.minReserved}-${ranges.maxReserved1}) 和后 5% (${ranges.minReserved2}-${ranges.maxReserved2}) 的地块被保留`
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 获取用户周围的地块（根据地块查找周围的）
 */
router.get('/:blockId/nearby', (req: Request, res: Response) => {
  const blockId = parseInt(req.params.blockId);
  const radius = parseInt(req.query.radius as string) || 100; // 默认100米

  // TODO: 实现逻辑
  // 1. 获取指定地块的坐标
  // 2. 查询该坐标周围radius米内的地块
  // 3. 包括周围的坟墓信息（如果公开）

  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: {
      centerBlock: null,
      nearbyBlocks: [],
      count: 0
    },
    timestamp: new Date().toISOString()
  });
});

export default router;

/**
 * 路由注册方式：
 * 
 * 在 server/index.ts 中添加：
 * 
 * import blockRoutes from './routes/block';
 * app.use('/api/blocks', blockRoutes);
 */
