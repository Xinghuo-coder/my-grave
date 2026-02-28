/**
 * 访问控制中间件
 * 用于检查用户是否有权执行某些操作
 */

import type { Request, Response, NextFunction } from 'express';
import type { UserSession } from '../types/user';
import { UserRole, hasPermission } from '../types/user';

declare global {
  namespace Express {
    interface Request {
      userSession: UserSession;
    }
  }
}

/**
 * 检查用户是否已登录
 */
export function requireLogin(req: Request, res: Response, next: NextFunction): void {
  const userSession = (req.session as any)?.user;

  if (!userSession || userSession.role === UserRole.GUEST) {
    res.status(401).json({
      success: false,
      status: 401,
      message: '需要登录',
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.userSession = userSession;
  next();
}

/**
 * 检查用户是否可以创建坟墓
 */
export function requireCreateGravePermission(req: Request, res: Response, next: NextFunction): void {
  const userSession = (req.session as any)?.user;

  if (!userSession) {
    res.status(401).json({
      success: false,
      status: 401,
      message: '需要登录',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (!hasPermission(userSession.role, 'CREATE_GRAVE')) {
    res.status(403).json({
      success: false,
      status: 403,
      message: '您没有权限创建坟墓。只有正式用户才能创建坟墓。',
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.userSession = userSession;
  next();
}

/**
 * 检查用户是否可以编辑某个坟墓
 */
export function requireEditGravePermission(req: Request, res: Response, next: NextFunction): void {
  const userSession = (req.session as any)?.user;
  const graveOwnerId = parseInt(req.params.userId);
  const userId = userSession?.userId;

  if (!userSession) {
    res.status(401).json({
      success: false,
      status: 401,
      message: '需要登录',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (!hasPermission(userSession.role, 'EDIT_GRAVE')) {
    res.status(403).json({
      success: false,
      status: 403,
      message: '您没有权限编辑坟墓',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 只有坟墓主人可以编辑自己的坟墓
  if (userId !== graveOwnerId) {
    res.status(403).json({
      success: false,
      status: 403,
      message: '您只能编辑自己的坟墓',
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.userSession = userSession;
  next();
}

/**
 * 检查用户是否可以查看某个坟墓
 */
export function requireViewGravePermission(req: Request, res: Response, next: NextFunction): void {
  const userSession = (req.session as any)?.user;

  if (!hasPermission(userSession?.role || UserRole.GUEST, 'VIEW_GRAVE_DETAILS')) {
    res.status(403).json({
      success: false,
      status: 403,
      message: '您没有权限查看坟墓详情',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (userSession) {
    req.userSession = userSession;
  } else {
    req.userSession = { role: UserRole.GUEST };
  }

  next();
}

/**
 * 获取当前用户会话
 */
export function getCurrentUser(req: Request): UserSession | null {
  return (req.session as any)?.user || null;
}

/**
 * 检查用户是否是管理员（可选）
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const userSession = (req.session as any)?.user;

  // 这里需要在 User 模型中添加 isAdmin 字段
  if (!userSession || !(userSession as any).isAdmin) {
    res.status(403).json({
      success: false,
      status: 403,
      message: '需要管理员权限',
      timestamp: new Date().toISOString()
    });
    return;
  }

  req.userSession = userSession;
  next();
}
