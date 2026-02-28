/**
 * 墓地鲜花、评论和点赞 API 路由
 */

import express, { Request, Response } from 'express';
import { GraveFlowerService } from '../services/GraveFlowerService';
import { GravePurchaseService } from '../services/GravePurchaseService';
import database from '../database';

const router = express.Router();

// 获取客户端 IP
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    ''
  );
}

/**
 * GET /api/flowers/config
 * 获取所有可用鲜花类型和价格
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const flowers = await GraveFlowerService.getAllFlowerConfigs();
    res.json({
      success: true,
      data: flowers
    });
  } catch (error: any) {
    console.error('获取鲜花配置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取鲜花配置失败',
      error: error.message
    });
  }
});

/**
 * GET /api/graves/:graveId/flowers
 * 获取指定墓地的鲜花赠送记录
 */
router.get('/graves/:graveId/flowers', async (req: Request, res: Response) => {
  try {
    const { graveId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // 验证墓地是否存在
    const grave = await database.query('SELECT id FROM graves WHERE id = ?', [graveId]);
    if (!grave || grave.length === 0) {
      return res.status(404).json({
        success: false,
        message: '墓地不存在'
      });
    }

    const flowers = await GraveFlowerService.getGraveFlowers(parseInt(graveId), limit);
    const stats = await GraveFlowerService.getGraveFlowerStats(parseInt(graveId));
    const total = await GraveFlowerService.getGraveTotalFlowers(parseInt(graveId));

    res.json({
      success: true,
      data: {
        flowers,
        stats,
        total
      }
    });
  } catch (error: any) {
    console.error('获取墓地鲜花错误:', error);
    res.status(500).json({
      success: false,
      message: '获取鲜花记录失败',
      error: error.message
    });
  }
});

/**
 * POST /api/graves/:graveId/flowers/send
 * 赠送鲜花（需要 USDT 支付）
 * 需要身份认证
 */
router.post('/graves/:graveId/flowers/send', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '需要登录'
      });
    }

    const { graveId } = req.params;
    const { flowerType, quantity, message } = req.body;

    // 验证参数
    if (!flowerType || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: '参数无效'
      });
    }

    // 验证墓地是否存在
    const grave = await database.query('SELECT id FROM graves WHERE id = ?', [graveId]);
    if (!grave || grave.length === 0) {
      return res.status(404).json({
        success: false,
        message: '墓地不存在'
      });
    }

    // 获取鲜花配置
    const flowerConfig = await GraveFlowerService.getFlowerConfig(flowerType);
    if (!flowerConfig) {
      return res.status(400).json({
        success: false,
        message: '鲜花类型不存在或不可用'
      });
    }

    // 计算费用
    const totalCost = flowerConfig.usdtPrice * quantity;

    // 创建购买订单
    const purchaseOrder = await GravePurchaseService.createPurchaseRecord(
      userId,
      'flower',
      totalCost,
      { flowerType, quantity }
    );

    res.json({
      success: true,
      message: '赠送鲜花需要支付，请完成支付',
      data: {
        orderId: purchaseOrder.id,
        flowerType,
        quantity,
        totalUSDT: totalCost,
        walletAddress: purchaseOrder.walletAddress,
        networkName: purchaseOrder.networkName
      }
    });
  } catch (error: any) {
    console.error('赠送鲜花错误:', error);
    res.status(500).json({
      success: false,
      message: '赠送鲜花失败',
      error: error.message
    });
  }
});

/**
 * POST /api/graves/:graveId/flowers/confirm
 * 确认鲜花支付并赠送
 * 需要订单 ID
 */
router.post('/graves/:graveId/flowers/confirm', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '需要登录'
      });
    }

    const { graveId } = req.params;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '订单 ID 缺失'
      });
    }

    // 验证并确认订单
    const order = await GravePurchaseService.getPurchaseOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: '订单未确认支付，请先完成支付'
      });
    }

    // 赠送鲜花
    const { flowerType, quantity } = order.metadata || {};
    if (!flowerType || !quantity) {
      return res.status(400).json({
        success: false,
        message: '订单数据不完整'
      });
    }

    const donation = await GraveFlowerService.donateFlower(
      parseInt(graveId),
      flowerType,
      quantity,
      userId,
      req.body.message
    );

    // 记录购买
    await GraveFlowerService.recordFlowerPurchase(userId, flowerType, quantity, order.amount);

    res.json({
      success: true,
      message: '鲜花赠送成功',
      data: donation
    });
  } catch (error: any) {
    console.error('确认鲜花支付错误:', error);
    res.status(500).json({
      success: false,
      message: '确认支付失败',
      error: error.message
    });
  }
});

/**
 * GET /api/graves/:graveId/likes
 * 获取墓地的点赞数
 */
router.get('/graves/:graveId/likes', async (req: Request, res: Response) => {
  try {
    const { graveId } = req.params;
    const userId = (req as any).session?.user?.id;
    const ipAddress = getClientIp(req);

    // 验证墓地是否存在
    const grave = await database.query('SELECT id FROM graves WHERE id = ?', [graveId]);
    if (!grave || grave.length === 0) {
      return res.status(404).json({
        success: false,
        message: '墓地不存在'
      });
    }

    const likesCount = await GraveFlowerService.getGraveLikesCount(parseInt(graveId));
    const hasLiked = userId
      ? await GraveFlowerService.hasUserLikedGrave(parseInt(graveId), userId)
      : await GraveFlowerService.hasUserLikedGrave(parseInt(graveId), undefined, ipAddress);

    res.json({
      success: true,
      data: {
        likesCount,
        hasLiked
      }
    });
  } catch (error: any) {
    console.error('获取点赞数错误:', error);
    res.status(500).json({
      success: false,
      message: '获取点赞数失败',
      error: error.message
    });
  }
});

/**
 * POST /api/graves/:graveId/like
 * 点赞墓地（免费）
 */
router.post('/graves/:graveId/like', async (req: Request, res: Response) => {
  try {
    const { graveId } = req.params;
    const userId = (req as any).session?.user?.id;
    const ipAddress = getClientIp(req);

    // 验证墓地是否存在
    const grave = await database.query('SELECT id FROM graves WHERE id = ?', [graveId]);
    if (!grave || grave.length === 0) {
      return res.status(404).json({
        success: false,
        message: '墓地不存在'
      });
    }

    // 检查是否已点赞
    const hasLiked = userId
      ? await GraveFlowerService.hasUserLikedGrave(parseInt(graveId), userId)
      : await GraveFlowerService.hasUserLikedGrave(parseInt(graveId), undefined, ipAddress);

    if (hasLiked) {
      return res.status(400).json({
        success: false,
        message: '您已经点赞过这个墓地'
      });
    }

    await GraveFlowerService.likeGrave(
      parseInt(graveId),
      userId,
      ipAddress
    );

    const likesCount = await GraveFlowerService.getGraveLikesCount(parseInt(graveId));

    res.json({
      success: true,
      message: '点赞成功',
      data: {
        likesCount
      }
    });
  } catch (error: any) {
    console.error('点赞墓地错误:', error);
    res.status(500).json({
      success: false,
      message: '点赞失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/graves/:graveId/like
 * 取消点赞墓地
 */
router.delete('/graves/:graveId/like', async (req: Request, res: Response) => {
  try {
    const { graveId } = req.params;
    const userId = (req as any).session?.user?.id;
    const ipAddress = getClientIp(req);

    const result = userId
      ? await GraveFlowerService.unlikeGrave(parseInt(graveId), userId)
      : await GraveFlowerService.unlikeGrave(parseInt(graveId), undefined, ipAddress);

    if (!result) {
      return res.status(400).json({
        success: false,
        message: '您未点赞此墓地'
      });
    }

    const likesCount = await GraveFlowerService.getGraveLikesCount(parseInt(graveId));

    res.json({
      success: true,
      message: '取消点赞成功',
      data: {
        likesCount
      }
    });
  } catch (error: any) {
    console.error('取消点赞错误:', error);
    res.status(500).json({
      success: false,
      message: '取消点赞失败',
      error: error.message
    });
  }
});

/**
 * POST /api/graves/:graveId/comments
 * 发表评论（免费）
 * 可选需要身份认证
 */
router.post('/graves/:graveId/comments', async (req: Request, res: Response) => {
  try {
    const { graveId } = req.params;
    const { commentText, isAnonymous } = req.body;
    const userId = (req as any).session?.user?.id;

    // 验证参数
    if (!commentText || commentText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    if (commentText.length > 500) {
      return res.status(400).json({
        success: false,
        message: '评论内容不能超过 500 字'
      });
    }

    // 验证墓地是否存在
    const grave = await database.query('SELECT id FROM graves WHERE id = ?', [graveId]);
    if (!grave || grave.length === 0) {
      return res.status(404).json({
        success: false,
        message: '墓地不存在'
      });
    }

    const comment = await GraveFlowerService.addComment(
      parseInt(graveId),
      commentText,
      userId,
      isAnonymous && !userId
    );

    res.json({
      success: true,
      message: '评论成功',
      data: comment
    });
  } catch (error: any) {
    console.error('发表评论错误:', error);
    res.status(500).json({
      success: false,
      message: '发表评论失败',
      error: error.message
    });
  }
});

/**
 * GET /api/graves/:graveId/comments
 * 获取墓地的评论列表
 */
router.get('/graves/:graveId/comments', async (req: Request, res: Response) => {
  try {
    const { graveId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // 验证墓地是否存在
    const grave = await database.query('SELECT id FROM graves WHERE id = ?', [graveId]);
    if (!grave || grave.length === 0) {
      return res.status(404).json({
        success: false,
        message: '墓地不存在'
      });
    }

    const result = await GraveFlowerService.getGraveComments(parseInt(graveId), page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('获取评论错误:', error);
    res.status(500).json({
      success: false,
      message: '获取评论失败',
      error: error.message
    });
  }
});

/**
 * POST /api/comments/:commentId/like
 * 点赞评论（免费）
 */
router.post('/comments/:commentId/like', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).session?.user?.id;
    const ipAddress = getClientIp(req);

    // 验证评论是否存在
    const comment = await database.query('SELECT id FROM grave_comments WHERE id = ?', [commentId]);
    if (!comment || comment.length === 0) {
      return res.status(404).json({
        success: false,
        message: '评论不存在'
      });
    }

    // 检查是否已点赞
    const hasLiked = userId
      ? await GraveFlowerService.hasUserLikedComment(parseInt(commentId), userId)
      : await GraveFlowerService.hasUserLikedComment(parseInt(commentId), undefined, ipAddress);

    if (hasLiked) {
      return res.status(400).json({
        success: false,
        message: '您已经点赞过此评论'
      });
    }

    await GraveFlowerService.likeComment(
      parseInt(commentId),
      userId,
      ipAddress
    );

    const likesCount = await GraveFlowerService.getCommentLikesCount(parseInt(commentId));

    res.json({
      success: true,
      message: '点赞成功',
      data: {
        likesCount
      }
    });
  } catch (error: any) {
    console.error('点赞评论错误:', error);
    res.status(500).json({
      success: false,
      message: '点赞失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/comments/:commentId/like
 * 取消点赞评论
 */
router.delete('/comments/:commentId/like', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).session?.user?.id;
    const ipAddress = getClientIp(req);

    const result = userId
      ? await GraveFlowerService.unlikeComment(parseInt(commentId), userId)
      : await GraveFlowerService.unlikeComment(parseInt(commentId), undefined, ipAddress);

    if (!result) {
      return res.status(400).json({
        success: false,
        message: '您未点赞此评论'
      });
    }

    const likesCount = await GraveFlowerService.getCommentLikesCount(parseInt(commentId));

    res.json({
      success: true,
      message: '取消点赞成功',
      data: {
        likesCount
      }
    });
  } catch (error: any) {
    console.error('取消点赞评论错误:', error);
    res.status(500).json({
      success: false,
      message: '取消点赞失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/comments/:commentId
 * 删除评论（仅评论者或管理员）
 */
router.delete('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).session?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '需要登录'
      });
    }

    const result = await GraveFlowerService.deleteComment(parseInt(commentId), userId);

    if (!result) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此评论'
      });
    }

    res.json({
      success: true,
      message: '评论删除成功'
    });
  } catch (error: any) {
    console.error('删除评论错误:', error);
    res.status(500).json({
      success: false,
      message: '删除评论失败',
      error: error.message
    });
  }
});

// 管理员路由
/**
 * PUT /api/flowers/admin/config
 * 更新鲜花配置（仅管理员）
 */
router.put('/admin/config', async (req: Request, res: Response) => {
  try {
    const user = (req as any).session?.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const { flowerType, flowerName, usdtPrice, isAvailable, dailyLimit } = req.body;

    if (!flowerType) {
      return res.status(400).json({
        success: false,
        message: '鲜花类型缺失'
      });
    }

    const config = await GraveFlowerService.getFlowerConfig(flowerType);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '鲜花配置不存在'
      });
    }

    // 更新配置
    const result = await database.query(
      `UPDATE grave_flower_config 
       SET flower_name = COALESCE(?, flower_name),
           usdt_price = COALESCE(?, usdt_price),
           is_available = COALESCE(?, is_available),
           daily_limit = COALESCE(?, daily_limit)
       WHERE flower_type = ?`,
      [flowerName, usdtPrice, isAvailable !== undefined ? isAvailable : null, dailyLimit, flowerType]
    );

    const updated = await GraveFlowerService.getFlowerConfig(flowerType);

    res.json({
      success: true,
      message: '配置更新成功',
      data: updated
    });
  } catch (error: any) {
    console.error('更新鲜花配置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error.message
    });
  }
});

export default router;
