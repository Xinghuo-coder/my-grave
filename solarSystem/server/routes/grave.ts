/**
 * 坟墓 API 路由定义
 * 
 * 端点说明：
 * GET  /api/graves                 - 获取公开的坟墓列表
 * GET  /api/graves/:id             - 获取坟墓详情
 * POST /api/graves                 - 创建坟墓（需要登录）
 * PUT  /api/graves/:id             - 更新坟墓（需要是坟墓主人）
 * DELETE /api/graves/:id           - 删除坟墓（需要是坟墓主人）
 * GET  /api/user/:userId/grave     - 获取用户的坟墓
 * POST /api/graves/:id/view        - 记录坟墓浏览
 * GET  /api/blocks/:blockId        - 获取地块信息
 * GET  /api/blocks/search          - 搜索地块
 */

import express, { Router, Request, Response } from 'express';
import type { CreateGraveRequest, UpdateGraveRequest } from '../types/grave';
import { 
  requireLogin, 
  requireCreateGravePermission, 
  requireEditGravePermission,
  requireViewGravePermission 
} from '../middleware/authorization';
import { GraveService } from '../services/GraveService';

const router = Router();

/**
 * 获取公开的坟墓列表（游客可访问）
 */
router.get('/', (req: Request, res: Response) => {
  // TODO: 实现逻辑
  // 1. 从数据库查询 is_public = true 的坟墓
  // 2. 分页处理
  // 3. 返回列表
  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: {
      graves: [],
      total: 0,
      page: 1,
      limit: 20
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 获取坟墓详情（游客可访问公开坟墓）
 */
router.get('/:id', requireViewGravePermission, (req: Request, res: Response) => {
  // TODO: 实现逻辑
  // 1. 从数据库查询坟墓
  // 2. 检查用户是否有权查看（公开或本人）
  // 3. 过滤内容
  // 4. 增加浏览计数
  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: null,
    timestamp: new Date().toISOString()
  });
});

/**
 * 创建坟墓（仅登录用户，每个账号最多一个）
 */
router.post('/', requireCreateGravePermission, (req: Request, res: Response) => {
  // TODO: 实现逻辑
  const body = req.body as CreateGraveRequest;
  
  // 1. 验证坟墓信息
  const validation = GraveService.validateGraveInfo(body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: '输入数据验证失败',
      data: { errors: validation.errors },
      timestamp: new Date().toISOString()
    });
  }

  // 2. 检查用户是否已有坟墓
  // const existingGrave = await GraveModel.findByUserId(req.userSession.userId);
  // if (existingGrave) {
  //   return res.status(409).json({...});
  // }

  // 3. 检查地块是否可用
  // const block = await BlockModel.findById(body.graveBlockId);
  // if (!block || block.is_occupied) {
  //   return res.status(400).json({...});
  // }

  // 4. 创建坟墓
  // const grave = await GraveModel.create({...});

  // 5. 标记地块为已占用
  // await BlockModel.update(graveBlockId, { is_occupied: true, grave_id: grave.id });

  res.status(201).json({
    success: true,
    status: 201,
    message: '坟墓创建成功',
    data: null,
    timestamp: new Date().toISOString()
  });
});

/**
 * 更新坟墓（仅坟墓主人）
 */
router.put('/:id', requireEditGravePermission, (req: Request, res: Response) => {
  // TODO: 实现逻辑
  const body = req.body as UpdateGraveRequest;

  // 1. 验证坟墓信息
  const validation = GraveService.validateGraveInfo(body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: '输入数据验证失败',
      data: { errors: validation.errors },
      timestamp: new Date().toISOString()
    });
  }

  // 2. 验证社交账号
  if (body.socialAccounts) {
    const socialValidation = GraveService.validateSocialAccounts(body.socialAccounts);
    if (!socialValidation.valid) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: '社交账号信息验证失败',
        data: { errors: socialValidation.errors },
        timestamp: new Date().toISOString()
      });
    }
  }

  // 3. 更新坟墓
  // const grave = await GraveModel.update(graveId, body);

  res.json({
    success: true,
    status: 200,
    message: '坟墓更新成功',
    data: null,
    timestamp: new Date().toISOString()
  });
});

/**
 * 删除坟墓（仅坟墓主人）
 */
router.delete('/:id', requireEditGravePermission, (req: Request, res: Response) => {
  // TODO: 实现逻辑
  // 1. 删除坟墓
  // const grave = await GraveModel.delete(graveId);
  // 2. 标记地块为未占用
  // await BlockModel.update(grave.grave_block_id, { is_occupied: false, grave_id: null });

  res.json({
    success: true,
    status: 200,
    message: '坟墓删除成功',
    timestamp: new Date().toISOString()
  });
});

/**
 * 获取用户的坟墓
 */
router.get('/user/:userId', requireViewGravePermission, (req: Request, res: Response) => {
  // TODO: 实现逻辑
  // 1. 从数据库查询用户的坟墓
  // 2. 检查权限（公开或本人）
  // 3. 返回坟墓信息

  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: null,
    timestamp: new Date().toISOString()
  });
});

/**
 * 记录坟墓浏览（增加浏览计数）
 */
router.post('/:id/view', (req: Request, res: Response) => {
  // TODO: 实现逻辑
  // 1. 检查坟墓是否存在
  // 2. 增加浏览计数
  // 3. 记录浏览历史
  
  res.json({
    success: true,
    status: 200,
    message: '浏览已记录',
    timestamp: new Date().toISOString()
  });
});

/**
 * 获取坟墓的完整度信息
 */
router.get('/:id/completion', (req: Request, res: Response) => {
  // TODO: 实现逻辑
  // 1. 获取坟墓信息
  // 2. 计算完整度
  // 3. 返回完整度信息和缺失的字段列表

  res.json({
    success: true,
    status: 200,
    message: 'Success',
    data: {
      completion: 0,
      missingFields: []
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
 * import graveRoutes from './routes/grave';
 * app.use('/api/graves', graveRoutes);
 */
