const VerificationCode = require('../models/VerificationCode');

class VerificationService {
  // 发送邮箱验证码（模拟）
  static async sendEmailCode(email, purpose = 'register') {
    try {
      const { code } = await VerificationCode.create('email', email, purpose);
      
      // 在实际生产环境中，这里应该调用真实的邮件服务（如SendGrid, AWS SES等）
      console.log(`📧 [模拟] 发送邮箱验证码到 ${email}: ${code}`);
      console.log(`   用途: ${purpose}`);
      console.log(`   有效期: 10分钟`);
      
      // 模拟发送成功
      return {
        success: true,
        message: '验证码已发送到邮箱（开发模式：验证码显示在控制台）',
        code: process.env.NODE_ENV === 'development' ? code : undefined // 开发环境返回验证码
      };
    } catch (error) {
      console.error('❌ 发送邮箱验证码失败:', error);
      return {
        success: false,
        message: '发送验证码失败，请稍后重试'
      };
    }
  }

  // 发送手机验证码（模拟）
  static async sendPhoneCode(phone, purpose = 'register') {
    try {
      const { code } = await VerificationCode.create('phone', phone, purpose);
      
      // 在实际生产环境中，这里应该调用真实的短信服务（如Twilio, 阿里云短信等）
      console.log(`📱 [模拟] 发送手机验证码到 ${phone}: ${code}`);
      console.log(`   用途: ${purpose}`);
      console.log(`   有效期: 10分钟`);
      
      // 模拟发送成功
      return {
        success: true,
        message: '验证码已发送到手机（开发模式：验证码显示在控制台）',
        code: process.env.NODE_ENV === 'development' ? code : undefined // 开发环境返回验证码
      };
    } catch (error) {
      console.error('❌ 发送手机验证码失败:', error);
      return {
        success: false,
        message: '发送验证码失败，请稍后重试'
      };
    }
  }

  // 验证验证码
  static async verifyCode(type, target, code, purpose) {
    try {
      const isValid = await VerificationCode.verify(type, target, code, purpose);
      return {
        success: isValid,
        message: isValid ? '验证成功' : '验证码无效或已过期'
      };
    } catch (error) {
      console.error('❌ 验证失败:', error);
      return {
        success: false,
        message: '验证失败，请重试'
      };
    }
  }
}

module.exports = VerificationService;
