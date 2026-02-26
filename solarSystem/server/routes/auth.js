const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const VerificationCodeService = require('../services/VerificationCodeService');
const VerificationService = require('../services/verificationService');

// ============ 注册相关 ============

// 发送注册验证码
router.post('/send-code', async (req, res) => {
  try {
    const { type, target, purpose } = req.body;

    if (!type || !target || !purpose) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 只支持邮箱验证码
    if (type !== 'email') {
      return res.status(400).json({
        success: false,
        message: '当前只支持邮箱验证，手机号短信验证暂未开放'
      });
    }

    // 检查邮箱是否已存在
    if (purpose === 'register') {
      const existingUser = await User.findByEmail(target);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被注册'
        });
      }
    }

    // 发送邮箱验证码
    const result = await VerificationService.sendEmailCode(target, purpose);

    res.json(result);
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 注册
router.post('/register', async (req, res) => {
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

    // 验证必填字段（手机号作为可选的安全信息，不需要验证码）
    if (!username || !email || !password || !emailCode || !securityQuestion || !securityAnswer) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 验证邮箱验证码
    const emailVerification = await VerificationService.verifyCode('email', email, emailCode, 'register');
    if (!emailVerification.success) {
      return res.status(400).json({
        success: false,
        message: '邮箱验证码无效'
      });
    }

    // 手机号作为可选的安全信息，用于账号找回
    // 不再验证手机号验证码

    // 检查用户名是否已存在
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已被使用'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      phone: phone || '',  // 手机号可选
      password,
      securityQuestion,
      securityAnswer
    });

    // 更新验证状态
    await User.updateVerificationStatus(user.id, 'email', true);
    await User.updateVerificationStatus(user.id, 'phone', true);

    // 设置会话
    req.session.userId = user.id;
    req.session.username = user.username;

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
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: error.code === 'SQLITE_CONSTRAINT' ? '邮箱或手机号已被注册' : '注册失败，请重试'
    });
  }
});

// ============ 登录相关 ============

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名和密码'
      });
    }

    // 查找用户
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 设置会话
    req.session.userId = user.id;
    req.session.username = user.username;

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
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请重试'
    });
  }
});

// 登出
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
    res.json({
      success: true,
      message: '登出成功'
    });
  });
});

// 检查登录状态
router.get('/check', async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        return res.json({
          success: true,
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone
          }
        });
      }
    } catch (error) {
      console.error('检查登录状态错误:', error);
    }
  }
  
  res.json({
    success: true,
    authenticated: false
  });
});

// ============ 忘记密码 ============

// 获取安全问题
router.post('/get-security-question', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名'
      });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      securityQuestion: user.security_question,
      email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // 部分隐藏邮箱
      phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') // 部分隐藏手机号
    });
  } catch (error) {
    console.error('获取安全问题错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 验证安全问题答案
router.post('/verify-security-answer', async (req, res) => {
  try {
    const { username, answer } = req.body;

    if (!username || !answer) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和答案'
      });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const isValidAnswer = await User.verifySecurityAnswer(answer, user.security_answer_hash);
    if (!isValidAnswer) {
      return res.status(401).json({
        success: false,
        message: '安全问题答案错误'
      });
    }

    // 生成重置密码令牌（存储在session中）
    req.session.resetPasswordUserId = user.id;
    req.session.resetPasswordStep = 'security_verified';

    res.json({
      success: true,
      message: '验证成功',
      email: user.email,
      phone: user.phone
    });
  } catch (error) {
    console.error('验证安全答案错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { username, newPassword, verificationCode, verificationType } = req.body;

    if (!username || !newPassword || !verificationCode || !verificationType) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 检查是否已通过安全问题验证
    if (req.session.resetPasswordStep !== 'security_verified' || req.session.resetPasswordUserId === undefined) {
      return res.status(403).json({
        success: false,
        message: '请先验证安全问题'
      });
    }

    const user = await User.findById(req.session.resetPasswordUserId);
    if (!user || user.username !== username) {
      return res.status(403).json({
        success: false,
        message: '验证失败'
      });
    }

    // 只支持邮箱验证码找回密码
    if (verificationType !== 'email') {
      return res.status(400).json({
        success: false,
        message: '当前只支持邮箱验证方式'
      });
    }

    // 验证邮箱验证码
    const verification = await VerificationService.verifyCode('email', user.email, verificationCode, 'reset_password');
    
    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: '验证码无效或已过期'
      });
    }

    // 更新密码
    await User.updatePassword(user.id, newPassword);

    // 清除重置密码session
    delete req.session.resetPasswordUserId;
    delete req.session.resetPasswordStep;

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      success: false,
      message: '密码重置失败，请重试'
    });
  }
});

module.exports = router;
