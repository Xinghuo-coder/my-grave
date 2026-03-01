/**
 * 认证路由 - TypeScript版本
 * 使用服务层、添加防刷机制、async/await、类型安全
 */

import express, { Request, Response, NextFunction, Router } from 'express';
import UserService from '../services/UserService';
import VerificationCodeService from '../services/VerificationCodeService';
import VerificationService from '../services/verificationService';

const router: Router = express.Router();

// 扩展 Session 类型
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    user?: {
      id: number;
      username: string;
    };
  }
}

// ============ 注册相关 ============

// 发送注册验证码
router.post('/send-code', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, target, purpose } = req.body;

    if (!type || !target || !purpose) {
      res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
      return;
    }

    // 只支持邮箱验证码
    if (type !== 'email') {
      res.status(400).json({
        success: false,
        message: '当前只支持邮箱验证,手机号短信验证暂未开放'
      });
      return;
    }

    // ✅ 防刷检查: 同一目标60秒内只能发送一次
    const remainingTime = await VerificationCodeService.checkRateLimit(type, target, 60);
    if (remainingTime > 0) {
      res.status(429).json({
        success: false,
        message: `请${remainingTime}秒后再试`,
        remainingTime
      });
      return;
    }

    // 检查邮箱是否已存在
    if (purpose === 'register') {
      const existingUser = await UserService.findByEmail(target);
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: '该邮箱已被注册'
        });
        return;
      }
    }

    // 发送邮箱验证码
    const result = await VerificationService.sendEmailCode(target, purpose);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// 注册
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      username, 
      email, 
      phone, 
      password, 
      emailCode, 
      phoneCode,
      securityQuestion,
      securityAnswer 
    } = req.body;

    // 验证必填字段
    if (!username || !email || !password || !emailCode || !securityQuestion || !securityAnswer) {
      res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
      return;
    }

    // ✅ 验证邮箱验证码 (使用新服务层)
    const emailValid = await VerificationCodeService.verify('email', email, emailCode, 'register');
    if (!emailValid) {
      res.status(400).json({
        success: false,
        message: '邮箱验证码无效或已过期'
      });
      return;
    }

    // 检查用户名是否已存在
    const existingUsername = await UserService.findByUsername(username);
    if (existingUsername) {
      res.status(400).json({
        success: false,
        message: '用户名已被使用'
      });
      return;
    }

    // ✅ 创建用户 (使用新服务层)
    const user = await UserService.create({
      username,
      email,
      phone: phone || '',
      password,
      securityQuestion,
      securityAnswer
    });

    // 更新验证状态
    await UserService.updateVerificationStatus(user.id, 'email', true);

    // 设置会话
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.user = { // 兼容旧代码
      id: user.id,
      username: user.username
    };

    res.json({
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error: any) {
    console.error('注册错误:', error);
    
    // 处理数据库唯一约束错误
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        message: '邮箱或手机号已被注册'
      });
      return;
    }
    
    next(error);
  }
});

// ============ 登录相关 ============

router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      });
      return;
    }

    // ✅ 查找用户 (使用新服务层)
    const user = await UserService.findByUsername(username);
    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
      return;
    }

    // ✅ 验证密码 (使用新服务层)
    const isValidPassword = await UserService.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
      return;
    }

    // 设置会话
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.user = { // 兼容旧代码
      id: user.id,
      username: user.username
    };

    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
});

// 登出
router.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
      return;
    }
    res.json({
      success: true,
      message: '登出成功'
    });
  });
});

// 获取当前登录用户信息
router.get('/me', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.session.userId) {
      res.status(401).json({
        success: false,
        message: '未登录'
      });
      return;
    }

    const user = await UserService.findById(req.session.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============ 密码重置相关 ============

// 发送密码重置验证码
router.post('/send-reset-code', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { target } = req.body;

    if (!target) {
      res.status(400).json({
        success: false,
        message: '请提供邮箱地址'
      });
      return;
    }

    // 检查用户是否存在
    const user = await UserService.findByEmail(target);
    if (!user) {
      // 为安全起见,不告诉用户邮箱是否存在
      res.json({
        success: true,
        message: '如果该邮箱已注册,验证码已发送'
      });
      return;
    }

    // 防刷检查
    const remainingTime = await VerificationCodeService.checkRateLimit('email', target, 60);
    if (remainingTime > 0) {
      res.status(429).json({
        success: false,
        message: `请${remainingTime}秒后再试`
      });
      return;
    }

    // 发送验证码
    await VerificationService.sendEmailCode(target, 'reset');

    res.json({
      success: true,
      message: '验证码已发送到邮箱'
    });
  } catch (error) {
    next(error);
  }
});

// 重置密码
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, newPassword, securityAnswer } = req.body;

    if (!email || !code || !newPassword || !securityAnswer) {
      res.status(400).json({
        success: false,
        message: '请填写所有字段'
      });
      return;
    }

    // 验证验证码
    const codeValid = await VerificationCodeService.verify('email', email, code, 'reset');
    if (!codeValid) {
      res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
      return;
    }

    // 查找用户
    const user = await UserService.findByEmail(email);
    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在'
      });
      return;
    }

    // 验证安全问题答案
    const answerValid = await UserService.verifySecurityAnswer(
      securityAnswer, 
      user.security_answer_hash
    );
    if (!answerValid) {
      res.status(400).json({
        success: false,
        message: '安全问题答案错误'
      });
      return;
    }

    // 更新密码
    await UserService.updatePassword(user.id, newPassword);

    res.json({
      success: true,
      message: '密码已重置,请使用新密码登录'
    });
  } catch (error) {
    next(error);
  }
});

// ============ 监控接口 ============

// 获取用户统计信息 (仅管理员)
router.get('/stats', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: 添加管理员权限检查
    const userStats = await UserService.getUserStats();
    const codeStats = await VerificationCodeService.getStats();

    res.json({
      success: true,
      stats: {
        users: userStats,
        verificationCodes: codeStats
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
