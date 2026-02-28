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
 * 
 * 加密特性：
 * - 所有坟墓信息在存储前按账号独立加密（AES-256-GCM）
 * - 只有坟墓所有者才能解密和查看完整内容
 * - 游客只能看到公开坟墓的基本信息
 * 
 * 加密流程：
 * 【创建/更新】入库前加密 → 使用 GraveService.encryptGraveForStorage(userId, data) 加密敏感字段
 * 【读取】读取后解密 → 使用 GraveService.decryptGraveFromStorage(userId, encryptedRow) 解密
 */

import express, { Router, Request, Response } from 'express';
import type { CreateGraveRequest, UpdateGraveRequest } from '../types/grave';
import { 
  requireLogin, 
  requireCreateGravePermission, 
  requireEditGravePermission
} from '../middleware/authorization';
import { GraveService } from '../services/GraveService';
import database from '../database';

const router = Router();

/**
 * 获取公开的坟墓列表（游客可访问）
 * 
 * 查询参数：
 * - page: 页号（默认1）
 * - limit: 每页数量（默认20，最大100）
 * - sort: 排序字段（created_at/view_count，默认created_at）
 * - order: 排序方向（asc/desc，默认desc）
 * 
 * 响应：返回公开坟墓的基本信息，不包含加密的敏感数据
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const sort = (req.query.sort as string || 'created_at');
    const order = (req.query.order as string || 'desc').toUpperCase();
    
    const offset = (page - 1) * limit;

    // 查询总数
    const countResult = await database.query(
      `SELECT COUNT(*) as total FROM graves WHERE is_public = 1`
    );
    const total = countResult[0]?.total || 0;

    // 查询公开坟墓（不返回加密内容）
    const graves = await database.query(
      `SELECT 
        id, user_id, location_name, is_public, view_count,
        created_at, updated_at,
        grave_data_encrypted, grave_data_encryption_version
      FROM graves 
      WHERE is_public = 1
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      success: true,
      status: 200,
      message: 'Success',
      data: {
        graves: graves.map((g: any) => ({
          id: g.id,
          userId: g.user_id,
          locationName: g.location_name,
          isPublic: g.is_public === 1,
          viewCount: g.view_count || 0,
          createdAt: g.created_at,
          updatedAt: g.updated_at,
          encryption: {
            encrypted: g.grave_data_encrypted === 1,
            version: g.grave_data_encryption_version
          }
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch graves:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: 'Failed to fetch graves',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取坟墓详情
 * 
 * 权限规则：
 * - 公开坟墓：任何人可见，但只能看到基本信息（不显示加密内容）
 * - 私密坟墓：仅坟墓所有者可见，返回完整解密后的信息
 * 
 * 流程：
 * 1. 查询坟墓数据
 * 2. 检查访问权限
 * 3. 如果是所有者，读取后解密（关键：调用 GraveService.decryptGraveFromStorage）
 * 4. 增加浏览计数
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const graveId = req.params.id;
    const viewerId = req.userSession?.userId;

    // 1. 查询坟墓
    const graveRows = await database.query(
      `SELECT * FROM graves WHERE id = ?`,
      [graveId]
    );

    if (!graveRows || graveRows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Grave not found',
        timestamp: new Date().toISOString()
      });
    }

    const graveRow = graveRows[0];
    const isOwner = viewerId && viewerId === graveRow.user_id;
    const isPublic = graveRow.is_public === 1;

    // 2. 检查权限
    if (!isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Access denied',
        timestamp: new Date().toISOString()
      });
    }

    // 3. 读取后解密（仅所有者可见完整内容）
    let graveData: any = {
      id: graveRow.id,
      userId: graveRow.user_id,
      locationName: graveRow.location_name,
      isPublic: graveRow.is_public === 1,
      viewCount: graveRow.view_count || 0,
      createdAt: graveRow.created_at,
      updatedAt: graveRow.updated_at
    };

    if (isOwner && graveRow.grave_data_encrypted === 1) {
      // 所有者可以看到完整的加密内容，需要读取后解密
      const decryptedData = GraveService.decryptGraveFromStorage(
        viewerId!,
        {
          deceasedName: graveRow.deceased_name,
          deceasedBirthDate: graveRow.deceased_birth_date,
          deceasedDeathDate: graveRow.deceased_death_date,
          deceasedAge: graveRow.deceased_age,
          epitaph: graveRow.epitaph,
          lifeOverview: graveRow.life_overview,
          selfEvaluation: graveRow.self_evaluation,
          othersEvaluation: graveRow.others_evaluation,
          influenceOnOthers: graveRow.influence_on_others,
          wishesBeforeDeath: graveRow.wishes_before_death,
          video: graveRow.video,
          photos: graveRow.photos ? JSON.parse(graveRow.photos) : undefined,
          will: graveRow.will,
          willDocUrl: graveRow.will_doc_url,
          inheritancePlan: graveRow.inheritance_plan,
          inheritancePlanUrl: graveRow.inheritance_plan_url,
          socialAccounts: graveRow.social_accounts ? JSON.parse(graveRow.social_accounts) : undefined
        }
      );
      graveData = { ...graveData, ...decryptedData };
    } else if (isPublic) {
      // 公开坟墓的游客只能看到基本信息（不包含敏感内容）
      graveData.encryption = {
        encrypted: true,
        version: graveRow.grave_data_encryption_version,
        note: 'Full content requires owner permission'
      };
    }

    // 4. 增加浏览计数
    try {
      await database.query(
        `UPDATE graves SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`,
        [graveId]
      );
    } catch (e) {
      console.error('Failed to update view count:', e);
    }

    res.json({
      success: true,
      status: 200,
      message: 'Success',
      data: graveData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch grave:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: 'Failed to fetch grave',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 创建坟墓（仅登录用户）
 * 
 * 需要权限：
 * - 登录状态
 * - 付费会员
 * - 每个账号最多一个坟墓
 * 
 * 加密流程：
 * 【入库前加密】
 * 1. 验证坟墓数据结构
 * 2. 使用 userId 派生的密钥加密所有敏感字段 → GraveService.encryptGraveForStorage(userId, data)
 * 3. 存储加密后的数据和加密版本号到数据库
 * 4. 返回完整坟墓信息（包含加密元数据）
 */
router.post('/', requireLogin, requireCreateGravePermission, async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateGraveRequest;
    const userId = req.userSession?.userId;

    // 1. 验证用户身份
    if (!userId) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: '登录会话无效，无法创建坟墓',
        timestamp: new Date().toISOString()
      });
    }

    // 2. 验证坟墓数据结构
    const validation = GraveService.validateGraveInfo(body as CreateGraveRequest);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: '输入数据验证失败',
        data: { errors: validation.errors },
        timestamp: new Date().toISOString()
      });
    }

    // 3. 检查用户是否已有坟墓（每个账号最多一个）
    const existingGraves = await database.query(
      `SELECT id FROM graves WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (existingGraves && existingGraves.length > 0) {
      return res.status(409).json({
        success: false,
        status: 409,
        message: '用户已有坟墓，每个账号最多拥有一个坟墓',
        data: { existingGraveId: existingGraves[0].id },
        timestamp: new Date().toISOString()
      });
    }

    // 【入库前加密】使用 userId 派生的密钥加密所有敏感字段
    const encryptedData = GraveService.encryptGraveForStorage(userId, body) as any;

    // 向数据库插入加密数据
    const result = await database.query(
      `INSERT INTO graves (
        user_id,
        deceased_name,
        deceased_birth_date,
        deceased_death_date,
        deceased_age,
        epitaph,
        life_overview,
        self_evaluation,
        others_evaluation,
        influence_on_others,
        wishes_before_death,
        video,
        photos,
        will,
        will_doc_url,
        inheritance_plan,
        inheritance_plan_url,
        social_accounts,
        location_name,
        grave_data_encrypted,
        grave_data_encryption_version,
        is_public,
        created_at,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        userId,
        encryptedData.deceasedName || null,
        encryptedData.deceasedBirthDate || null,
        encryptedData.deceasedDeathDate || null,
        encryptedData.deceasedAge || null,
        encryptedData.epitaph || null,
        encryptedData.lifeOverview || null,
        encryptedData.selfEvaluation || null,
        encryptedData.othersEvaluation || null,
        encryptedData.influenceOnOthers || null,
        encryptedData.wishesBeforeDeath ? JSON.stringify(encryptedData.wishesBeforeDeath) : null,
        encryptedData.video || null,
        encryptedData.photos ? JSON.stringify(encryptedData.photos) : null,
        encryptedData.will || null,
        encryptedData.willDocUrl || null,
        encryptedData.inheritancePlan || null,
        encryptedData.inheritancePlanUrl || null,
        encryptedData.socialAccounts ? JSON.stringify(encryptedData.socialAccounts) : null,
        (body as any).locationName || null,
        true, // grave_data_encrypted
        'v1', // grave_data_encryption_version
        (body as any).isPublic ? 1 : 0,
        new Date(),
        new Date()
      ]
    );

    // 返回解密后的完整信息给所有者
    const graveId = result.insertId;
    const responseData = encryptedData as any;
    res.status(201).json({
      success: true,
      status: 201,
      message: '坟墓创建成功',
      data: {
        id: graveId,
        userId: userId,
        ...responseData,
        locationName: (body as any).locationName,
        isPublic: (body as any).isPublic || false,
        viewCount: 0,
        encryption: {
          enabled: true,
          mode: 'per-account',
          version: 'v1',
          algorithm: 'AES-256-GCM'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to create grave:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: '坟墓创建失败',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 更新坟墓（仅坟墓主人）
 * 
 * 加密流程：
 * 【入库前加密】
 * 1. 验证用户身份和权限
 * 2. 查询现有坟墓数据
 * 3. 验证更新的数据结构
 * 4. 使用 userId 派生的密钥加密更新的字段 → GraveService.encryptGraveForStorage(userId, updateData)
 * 5. 更新数据库中的加密内容
 * 6. 返回更新后的解密数据
 */
router.put('/:id', requireLogin, requireEditGravePermission, async (req: Request, res: Response) => {
  try {
    const graveId = req.params.id;
    const body = req.body as UpdateGraveRequest;
    const userId = req.userSession?.userId;

    // 1. 验证用户身份
    if (!userId) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: '登录会话无效，无法更新坟墓',
        timestamp: new Date().toISOString()
      });
    }

    // 2. 查询现有坟墓
    const graveRows = await database.query(
      `SELECT * FROM graves WHERE id = ? AND user_id = ?`,
      [graveId, userId]
    );

    if (!graveRows || graveRows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: '坟墓不存在或无权修改',
        timestamp: new Date().toISOString()
      });
    }

    const graveRow = graveRows[0];

    // 3. 验证更新的数据结构
    const validation = GraveService.validateGraveInfo(body as UpdateGraveRequest);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: '输入数据验证失败',
        data: { errors: validation.errors },
        timestamp: new Date().toISOString()
      });
    }

    // 【入库前加密】使用 userId 派生的密钥加密更新的字段
    const encryptedData = GraveService.encryptGraveForStorage(userId, body) as any;

    // 更新数据库
    await database.query(
      `UPDATE graves SET
        deceased_name = ?,
        deceased_birth_date = ?,
        deceased_death_date = ?,
        deceased_age = ?,
        epitaph = ?,
        life_overview = ?,
        self_evaluation = ?,
        others_evaluation = ?,
        influence_on_others = ?,
        wishes_before_death = ?,
        video = ?,
        photos = ?,
        will = ?,
        will_doc_url = ?,
        inheritance_plan = ?,
        inheritance_plan_url = ?,
        social_accounts = ?,
        location_name = ?,
        is_public = ?,
        grave_data_encrypted = ?,
        grave_data_encryption_version = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?`,
      [
        encryptedData.deceasedName || null,
        encryptedData.deceasedBirthDate || null,
        encryptedData.deceasedDeathDate || null,
        encryptedData.deceasedAge || null,
        encryptedData.epitaph || null,
        encryptedData.lifeOverview || null,
        encryptedData.selfEvaluation || null,
        encryptedData.othersEvaluation || null,
        encryptedData.influenceOnOthers || null,
        encryptedData.wishesBeforeDeath ? JSON.stringify(encryptedData.wishesBeforeDeath) : null,
        encryptedData.video || null,
        encryptedData.photos ? JSON.stringify(encryptedData.photos) : null,
        encryptedData.will || null,
        encryptedData.willDocUrl || null,
        encryptedData.inheritancePlan || null,
        encryptedData.inheritancePlanUrl || null,
        encryptedData.socialAccounts ? JSON.stringify(encryptedData.socialAccounts) : null,
        (body as any).locationName || graveRow.location_name,
        (body as any).isPublic !== undefined ? ((body as any).isPublic ? 1 : 0) : graveRow.is_public,
        true, // grave_data_encrypted
        'v1', // grave_data_encryption_version
        new Date(),
        graveId,
        userId
      ]
    );

    // 返回更新后的解密数据
    const responseData = encryptedData as any;
    res.json({
      success: true,
      status: 200,
      message: '坟墓更新成功',
      data: {
        id: graveId,
        userId: userId,
        ...responseData,
        locationName: (body as any).locationName || graveRow.location_name,
        isPublic: (body as any).isPublic !== undefined ? (body as any).isPublic : (graveRow.is_public === 1),
        viewCount: graveRow.view_count || 0,
        encryption: {
          enabled: true,
          mode: 'per-account',
          version: 'v1',
          algorithm: 'AES-256-GCM'
        },
        createdAt: graveRow.created_at,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to update grave:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: '坟墓更新失败',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 删除坟墓（仅坟墓主人）
 */
router.delete('/:id', requireLogin, requireEditGravePermission, async (req: Request, res: Response) => {
  try {
    const graveId = req.params.id;
    const userId = req.userSession?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: '登录会话无效，无法删除坟墓',
        timestamp: new Date().toISOString()
      });
    }

    // 查询坟墓（确认所有权）
    const graveRows = await database.query(
      `SELECT * FROM graves WHERE id = ? AND user_id = ?`,
      [graveId, userId]
    );

    if (!graveRows || graveRows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: '坟墓不存在或无权删除',
        timestamp: new Date().toISOString()
      });
    }

    // 删除坟墓
    await database.query(
      `DELETE FROM graves WHERE id = ? AND user_id = ?`,
      [graveId, userId]
    );

    res.json({
      success: true,
      status: 200,
      message: '坟墓删除成功',
      data: { id: graveId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to delete grave:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: '坟墓删除失败',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取用户的坟墓（用户私有端点）
 * 
 * 仅返回登录用户自己的坟墓的完整信息（读取后解密）
 * 
 * 流程：
 * 1. 验证用户身份和访问权限
 * 2. 从数据库查询用户的坟墓
 * 3. 读取后解密：所有者获得完整解密内容 → GraveService.decryptGraveFromStorage(userId, graveRow)
 */
router.get('/user/:userId', requireLogin, async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const viewerId = req.userSession?.userId;

    // 只有用户本人可以查看自己的坟墓
    if (viewerId !== parseInt(targetUserId)) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: '只能查看自己的坟墓信息',
        timestamp: new Date().toISOString()
      });
    }

    // 查询用户的坟墓
    const graveRows = await database.query(
      `SELECT * FROM graves WHERE user_id = ?`,
      [viewerId]
    );

    if (!graveRows || graveRows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: '用户还没有创建坟墓',
        timestamp: new Date().toISOString()
      });
    }

    const graveRow = graveRows[0];

    // 【读取后解密】所有者获得完整解密内容
    let graveData: any = {
      id: graveRow.id,
      userId: graveRow.user_id,
      locationName: graveRow.location_name,
      isPublic: graveRow.is_public === 1,
      viewCount: graveRow.view_count || 0,
      createdAt: graveRow.created_at,
      updatedAt: graveRow.updated_at
    };

    if (graveRow.grave_data_encrypted === 1) {
      const decryptedData = GraveService.decryptGraveFromStorage(
        viewerId!,
        {
          deceasedName: graveRow.deceased_name,
          deceasedBirthDate: graveRow.deceased_birth_date,
          deceasedDeathDate: graveRow.deceased_death_date,
          deceasedAge: graveRow.deceased_age,
          epitaph: graveRow.epitaph,
          lifeOverview: graveRow.life_overview,
          selfEvaluation: graveRow.self_evaluation,
          othersEvaluation: graveRow.others_evaluation,
          influenceOnOthers: graveRow.influence_on_others,
          wishesBeforeDeath: graveRow.wishes_before_death,
          video: graveRow.video,
          photos: graveRow.photos ? JSON.parse(graveRow.photos) : undefined,
          will: graveRow.will,
          willDocUrl: graveRow.will_doc_url,
          inheritancePlan: graveRow.inheritance_plan,
          inheritancePlanUrl: graveRow.inheritance_plan_url,
          socialAccounts: graveRow.social_accounts ? JSON.parse(graveRow.social_accounts) : undefined
        }
      );
      graveData = { ...graveData, ...decryptedData };
    }

    res.json({
      success: true,
      status: 200,
      message: 'Success',
      data: graveData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch user grave:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: '获取坟墓失败',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 记录坟墓浏览（仅增加计数，不返回内容）
 */
router.post('/:id/view', async (req: Request, res: Response) => {
  try {
    const graveId = req.params.id;

    // 检查坟墓是否存在且公开
    const graveRows = await database.query(
      `SELECT id FROM graves WHERE id = ? AND is_public = 1`,
      [graveId]
    );

    if (!graveRows || graveRows.length === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Grave not found or not public',
        timestamp: new Date().toISOString()
      });
    }

    // 增加浏览计数
    await database.query(
      `UPDATE graves SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`,
      [graveId]
    );

    res.json({
      success: true,
      status: 200,
      message: 'View recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to record view:', error);
    res.status(500).json({
      success: false,
      status: 500,
      message: 'Failed to record view',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
