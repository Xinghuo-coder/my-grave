/**
 * 墓地购买 API 路由
 * 
 * 端点说明：
 * GET  /api/purchase/config           - 获取购买配置
 * GET  /api/purchase/user/quota       - 获取用户配额
 * POST /api/purchase/calculate        - 计算购买价格
 * POST /api/purchase/create-order     - 创建购买订单
 * GET  /api/purchase/order/:id        - 获取订单详情
 * POST /api/purchase/confirm-order    - 确认购买（管理员）
 * GET  /api/purchase/history          - 获取用户购买历史
 * 
 * 管理员端点：
 * GET  /api/purchase/admin/config     - 获取配置（管理员）
 * PUT  /api/purchase/admin/config     - 更新配置（管理员）
 */

import express, { Router, Request, Response } from 'express';
import { requireLogin, requireAdmin } from '../middleware/authorization';
import { GravePurchaseService } from '../services/GravePurchaseService';

const router = Router();

/**
 * 获取购买配置（所有人可访问）
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await GravePurchaseService.getConfig() || 
                   await GravePurchaseService.initializeConfig();

    res.json({
      success: true,
      status: 200,
      data: {
        freeGravesPerUser: config.freeGravesPerUser,
        usdtPricePerGrave: config.usdtPricePerGrave,
        currency: config.currency,
        isEnabled: config.isEnabled
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取购买配置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

/**
 * 获取用户配额（需要登录）
 */
router.get('/user/quota', requireLogin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    const quota = await GravePurchaseService.getUserQuota(userId);
    if (!quota) {
      return res.status(404).json({
        success: false,
        message: '用户配额不存在'
      });
    }

    const graveCount = await GravePurchaseService.getUserGraveCount(userId);
    const availableSlots = quota.freeGravesAllocated + quota.purchasedGraves;

    res.json({
      success: true,
      status: 200,
      data: {
        freeGravesAllocated: quota.freeGravesAllocated,
        purchasedGraves: quota.purchasedGraves,
        totalAvailableSlots: availableSlots,
        usedSlots: graveCount,
        remainingSlots: availableSlots - graveCount,
        canCreateMore: graveCount < availableSlots
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取用户配额错误:', error);
    res.status(500).json({
      success: false,
      message: '获取配额失败'
    });
  }
});

/**
 * 计算购买价格
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '购买数量必须大于0'
      });
    }

    const pricing = await GravePurchaseService.calculatePurchasePrice(quantity);

    if (!pricing) {
      return res.status(400).json({
        success: false,
        message: '购买功能未启用'
      });
    }

    res.json({
      success: true,
      status: 200,
      data: pricing,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('计算购买价格错误:', error);
    res.status(500).json({
      success: false,
      message: '计算价格失败'
    });
  }
});

/**
 * 创建购买订单（需要登录）
 */
router.post('/create-order', requireLogin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    const { quantity, walletAddress, blockchainNetwork } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '购买数量必须大于0'
      });
    }

    // 验证钱包地址格式（简单验证）
    if (!walletAddress || walletAddress.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的钱包地址'
      });
    }

    // 计算价格
    const pricing = await GravePurchaseService.calculatePurchasePrice(quantity);
    if (!pricing) {
      return res.status(400).json({
        success: false,
        message: '购买功能未启用'
      });
    }

    // 创建订单
    const record = await GravePurchaseService.createPurchaseRecord(
      userId,
      quantity,
      pricing.totalPrice,
      walletAddress,
      blockchainNetwork || 'unknown'
    );

    res.json({
      success: true,
      status: 201,
      message: '订单创建成功，等待支付确认',
      data: {
        orderId: record.id,
        quantity: record.quantity,
        usdtAmount: record.usdtAmount,
        status: record.status,
        walletAddress: record.walletAddress,
        createdAt: record.createdAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('创建购买订单错误:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败'
    });
  }
});

/**
 * 获取订单详情（需要登录）
 */
router.get('/order/:orderId', requireLogin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    const orderId = parseInt(req.params.orderId);
    const record = await GravePurchaseService.getPurchaseRecord(orderId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 验证所有权
    if (record.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权访问该订单'
      });
    }

    res.json({
      success: true,
      status: 200,
      data: record,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单失败'
    });
  }
});

/**
 * 获取用户购买历史（需要登录）
 */
router.get('/history', requireLogin, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }

    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const records = await GravePurchaseService.getUserPurchaseHistory(userId, limit);

    res.json({
      success: true,
      status: 200,
      data: {
        records,
        total: records.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取购买历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取历史失败'
    });
  }
});

/**
 * 确认购买订单（管理员）
 */
router.post('/confirm-order', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orderId, transactionHash } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: '订单ID必须提供'
      });
    }

    // 更新订单状态为已确认
    const updated = await GravePurchaseService.updatePurchaseRecordStatus(
      orderId,
      'confirmed',
      transactionHash
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: '更新订单失败'
      });
    }

    // 确认购买，更新用户配额
    await GravePurchaseService.confirmPurchase(orderId);

    res.json({
      success: true,
      status: 200,
      message: '订单已确认，用户配额已更新',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('确认购买订单错误:', error);
    res.status(500).json({
      success: false,
      message: '确认订单失败'
    });
  }
});

// ============ 管理员路由 ============

/**
 * 获取购买配置（管理员）
 */
router.get('/admin/config', requireAdmin, async (req: Request, res: Response) => {
  try {
    const config = await GravePurchaseService.getConfig() || 
                   await GravePurchaseService.initializeConfig();

    res.json({
      success: true,
      status: 200,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('获取配置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

/**
 * 更新购买配置（管理员）
 */
router.put('/admin/config', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { freeGravesPerUser, usdtPricePerGrave, isEnabled } = req.body;

    // 验证输入
    if (freeGravesPerUser !== undefined && (freeGravesPerUser < 0 || !Number.isInteger(freeGravesPerUser))) {
      return res.status(400).json({
        success: false,
        message: '免费墓地数必须是非负整数'
      });
    }

    if (usdtPricePerGrave !== undefined && (usdtPricePerGrave < 0 || typeof usdtPricePerGrave !== 'number')) {
      return res.status(400).json({
        success: false,
        message: '价格必须是正数'
      });
    }

    const config = await GravePurchaseService.getConfig() || 
                   await GravePurchaseService.initializeConfig();

    const updated = await GravePurchaseService.updateConfig({
      id: config.id,
      freeGravesPerUser,
      usdtPricePerGrave,
      isEnabled
    });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: '更新配置失败'
      });
    }

    const updatedConfig = await GravePurchaseService.getConfig();

    res.json({
      success: true,
      status: 200,
      message: '配置已更新',
      data: updatedConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('更新配置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新配置失败'
    });
  }
});

export default router;
