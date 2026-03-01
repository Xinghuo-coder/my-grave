/**
 * 用户服务层 - TypeScript版本
 * 封装所有用户相关的数据库操作
 * 使用 async/await 替代回调,支持 MySQL 和 SQLite
 */

import bcrypt from 'bcrypt';
// TODO: 需要将database模块迁移到TypeScript
const { query, execute, getOne } = require('../database');

// 优化: 从 10 降到 8,性能提升 4 倍,安全性仍足够
const SALT_ROUNDS = 8;

/**
 * 用户数据接口
 */
export interface UserData {
  username: string;
  email: string;
  phone?: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}

/**
 * 数据库中的用户记录
 */
export interface UserRecord {
  id: number;
  username: string;
  email: string;
  phone?: string;
  password_hash: string;
  security_question: string;
  security_answer_hash: string;
  email_verified: number;
  phone_verified: number;
  created_at: string;
  updated_at: string;
}

/**
 * 用户统计信息
 */
export interface UserStats {
  total_users: number;
  verified_users: number;
  new_users_week: number;
}

class UserService {
  /**
   * 创建新用户
   */
  static async create(userData: UserData): Promise<{ id: number; username: string; email: string; phone?: string }> {
    const { username, email, phone, password, securityQuestion, securityAnswer } = userData;
    
    // 加密密码和安全问题答案
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase(), SALT_ROUNDS);

    const sql = `
      INSERT INTO users (username, email, phone, password_hash, security_question, security_answer_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await execute(sql, [
      username, 
      email, 
      phone || '', 
      passwordHash, 
      securityQuestion, 
      securityAnswerHash
    ]);
    
    return {
      id: result.lastID || result.insertId,
      username,
      email,
      phone
    };
  }

  /**
   * 通过用户名查找用户
   */
  static async findByUsername(username: string): Promise<UserRecord | null> {
    const sql = 'SELECT * FROM users WHERE username = ?';
    return await getOne(sql, [username]);
  }

  /**
   * 通过邮箱查找用户
   */
  static async findByEmail(email: string): Promise<UserRecord | null> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return await getOne(sql, [email]);
  }

  /**
   * 通过手机号查找用户
   */
  static async findByPhone(phone: string): Promise<UserRecord | null> {
    const sql = 'SELECT * FROM users WHERE phone = ?';
    return await getOne(sql, [phone]);
  }

  /**
   * 通过ID查找用户
   */
  static async findById(id: number): Promise<UserRecord | null> {
    const sql = 'SELECT * FROM users WHERE id = ?';
    return await getOne(sql, [id]);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * 验证安全问题答案
   */
  static async verifySecurityAnswer(answer: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(answer.toLowerCase(), hash);
  }

  /**
   * 更新密码
   */
  static async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    const sql = `
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await execute(sql, [passwordHash, userId]);
    return result.changes > 0 || result.affectedRows > 0;
  }

  /**
   * 更新验证状态
   */
  static async updateVerificationStatus(userId: number, type: 'email' | 'phone', verified: boolean): Promise<boolean> {
    const column = type === 'email' ? 'email_verified' : 'phone_verified';
    const sql = `
      UPDATE users 
      SET ${column} = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await execute(sql, [verified ? 1 : 0, userId]);
    return result.changes > 0 || result.affectedRows > 0;
  }

  /**
   * 获取用户统计信息 (用于监控)
   */
  static async getUserStats(): Promise<UserStats> {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_verified = 1 THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as new_users_week
      FROM users
    `;
    return await getOne(sql);
  }
}

export default UserService;
