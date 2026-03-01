/**
 * 认证中间件 - TypeScript版本
 */

import { Request, Response, NextFunction } from 'express';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      isAuthenticated?: boolean;
      userId?: number;
      username?: string;
    }
  }
}

/**
 * 登录验证中间件
 * 要求用户必须登录
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }
}

/**
 * 检查登录状态的中间件（不强制登录）
 * 设置 req.isAuthenticated 标志
 */
export function checkAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.userId) {
    req.isAuthenticated = true;
    req.userId = req.session.userId;
    req.username = req.session.username;
  } else {
    req.isAuthenticated = false;
  }
  next();
}

export default {
  requireAuth,
  checkAuth
};
