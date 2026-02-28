/**
 * 地块 API 路由定义
 * 
 * 端点说明：
 * GET  /api/blocks/:blockId         - 获取地块信息和关联的坟墓
 * GET  /api/blocks/search           - 搜索地块（按编号或位置）
 * GET  /api/blocks/available        - 获取未被占用的地块
 * POST /api/blocks                  - 创建地块（管理员）
 */

import express, { Router, Request, Response } from 'express';
import type { BlockSearchRequest } from '../types/block';

const router = Router();

/**
 * 获取地块详情
 */
router.get('/:blockId', (req: Request, res: Response) => {
  // TODO: 实现逻辑
  // 1. 从数据库查询地块信息
  // 2. 如果有关联的坟墓，获取坟墓信息（如果公开或用户有权限）
  // 3. 返回地块信息

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
  // 3. 返回地块信息

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
 * 获取未被占用的地块列表
 */
router.get('/available', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // TODO: 实现逻辑
  // 1. 从数据库查询 is_occupied = false 的地块
  // 2. 分页处理
  // 3. 返回地块列表

  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: {
      blocks: [],
      total: 0,
      page,
      limit
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
