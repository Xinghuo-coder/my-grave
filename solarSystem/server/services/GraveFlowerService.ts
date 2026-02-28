/**
 * 墓地鲜花和评论服务
 * 处理鲜花购买、赠送、评论和点赞功能
 */

import database from '../database';

export interface FlowerConfig {
  id: number;
  flowerType: string;
  flowerName: string;
  flowerEmoji?: string;
  usdtPrice: number;
  description?: string;
  isAvailable: boolean;
  dailyLimit?: number;
}

export interface FlowerDonation {
  id: number;
  graveId: number;
  userId?: number;
  flowerType: string;
  quantity: number;
  message?: string;
  donatedAt: Date;
}

export interface GraveComment {
  id: number;
  graveId: number;
  userId?: number;
  commentText: string;
  isAnonymous: boolean;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GraveFlowerService {
  /**
   * 初始化默认鲜花配置
   */
  static async initializeFlowerConfig(): Promise<FlowerConfig[]> {
    try {
      // 检查是否已存在配置
      const existing = await database.query('SELECT COUNT(*) as count FROM grave_flower_config');
      if (existing[0]?.count > 0) {
        return this.getAllFlowerConfigs();
      }

      // 创建默认鲜花配置
      const flowers = [
        {
          flowerType: 'rose',
          flowerName: '玫瑰花',
          flowerEmoji: '🌹',
          usdtPrice: 1,
          description: '象征爱与热情的红玫瑰'
        },
        {
          flowerType: 'lily',
          flowerName: '百合花',
          flowerEmoji: '🌸',
          uszPrice: 2,
          description: '象征纯洁与高雅的百合'
        },
        {
          flowerType: 'chrysanthemum',
          flowerName: '菊花',
          flowerEmoji: '🌼',
          usdtPrice: 1,
          description: '传统的祭奠之花'
        },
        {
          flowerType: 'sunflower',
          flowerName: '向日葵',
          flowerEmoji: '🌻',
          usdtPrice: 1.5,
          description: '象征永恒的祝福'
        },
        {
          flowerType: 'tulip',
          flowerName: '郁金香',
          flowerEmoji: '🌷',
          usdtPrice: 2,
          description: '优雅而高贵的郁金香'
        }
      ];

      for (const flower of flowers) {
        await database.query(
          `INSERT INTO grave_flower_config 
           (flower_type, flower_name, flower_emoji, usdt_price, description, is_available)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            flower.flowerType,
            flower.flowerName,
            flower.flowerEmoji,
            flower.usdtPrice,
            flower.description,
            1
          ]
        );
      }

      return this.getAllFlowerConfigs();
    } catch (error) {
      console.error('初始化鲜花配置错误:', error);
      throw error;
    }
  }

  /**
   * 获取所有可用的鲜花配置
   */
  static async getAllFlowerConfigs(): Promise<FlowerConfig[]> {
    try {
      const result = await database.query(
        `SELECT 
          id, flower_type as flowerType, flower_name as flowerName,
          flower_emoji as flowerEmoji, usdt_price as usdtPrice,
          description, is_available as isAvailable, daily_limit as dailyLimit
        FROM grave_flower_config
        WHERE is_available = true
        ORDER BY usdt_price ASC`
      );

      return result;
    } catch (error) {
      console.error('获取鲜花配置错误:', error);
      throw error;
    }
  }

  /**
   * 获取单个鲜花配置
   */
  static async getFlowerConfig(flowerType: string): Promise<FlowerConfig | null> {
    try {
      const result = await database.query(
        `SELECT 
          id, flower_type as flowerType, flower_name as flowerName,
          flower_emoji as flowerEmoji, usdt_price as usdtPrice,
          description, is_available as isAvailable, daily_limit as dailyLimit
        FROM grave_flower_config
        WHERE flower_type = ? AND is_available = true`,
        [flowerType]
      );

      return result[0] || null;
    } catch (error) {
      console.error('获取鲜花配置错误:', error);
      throw error;
    }
  }

  /**
   * 记录用户购买鲜花
   */
  static async recordFlowerPurchase(
    userId: number,
    flowerType: string,
    quantity: number,
    usdtAmount: number
  ): Promise<boolean> {
    try {
      await database.query(
        `INSERT INTO user_flower_purchases
         (user_id, flower_type, quantity, usdt_amount)
         VALUES (?, ?, ?, ?)`,
        [userId, flowerType, quantity, usdtAmount]
      );

      return true;
    } catch (error) {
      console.error('记录鲜花购买错误:', error);
      throw error;
    }
  }

  /**
   * 赠送鲜花
   */
  static async donateFlower(
    graveId: number,
    flowerType: string,
    quantity: number,
    userId?: number,
    message?: string
  ): Promise<FlowerDonation> {
    try {
      const result = await database.query(
        `INSERT INTO grave_flower_donations
         (grave_id, user_id, flower_type, quantity, message)
         VALUES (?, ?, ?, ?, ?)`,
        [graveId, userId || null, flowerType, quantity, message || null]
      );

      const donation = await database.query(
        `SELECT 
          id, grave_id as graveId, user_id as userId, flower_type as flowerType,
          quantity, message, donated_at as donatedAt
        FROM grave_flower_donations
        WHERE id = ?`,
        [result.insertId]
      );

      return donation[0];
    } catch (error) {
      console.error('赠送鲜花错误:', error);
      throw error;
    }
  }

  /**
   * 获取墓地的鲜花赠送记录
   */
  static async getGraveFlowers(graveId: number, limit: number = 50): Promise<FlowerDonation[]> {
    try {
      const result = await database.query(
        `SELECT 
          id, grave_id as graveId, user_id as userId, flower_type as flowerType,
          quantity, message, donated_at as donatedAt
        FROM grave_flower_donations
        WHERE grave_id = ?
        ORDER BY donated_at DESC
        LIMIT ?`,
        [graveId, limit]
      );

      return result;
    } catch (error) {
      console.error('获取墓地鲜花记录错误:', error);
      throw error;
    }
  }

  /**
   * 获取墓地的鲜花统计（各类型数量）
   */
  static async getGraveFlowerStats(graveId: number): Promise<Record<string, number>> {
    try {
      const result = await database.query(
        `SELECT 
          flower_type as flowerType,
          SUM(quantity) as totalQuantity
        FROM grave_flower_donations
        WHERE grave_id = ?
        GROUP BY flower_type`,
        [graveId]
      );

      const stats: Record<string, number> = {};
      result.forEach((row: any) => {
        stats[row.flowerType] = row.totalQuantity || 0;
      });

      return stats;
    } catch (error) {
      console.error('获取墓地鲜花统计错误:', error);
      throw error;
    }
  }

  /**
   * 获取墓地的总鲜花数量
   */
  static async getGraveTotalFlowers(graveId: number): Promise<number> {
    try {
      const result = await database.query(
        `SELECT SUM(quantity) as total FROM grave_flower_donations WHERE grave_id = ?`,
        [graveId]
      );

      return result[0]?.total || 0;
    } catch (error) {
      console.error('获取墓地总鲜花数错误:', error);
      throw error;
    }
  }

  /**
   * 点赞墓地（免费）
   */
  static async likeGrave(
    graveId: number,
    userId?: number,
    ipAddress?: string
  ): Promise<boolean> {
    try {
      await database.query(
        `INSERT INTO grave_likes (grave_id, user_id, ip_address)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP`,
        [graveId, userId || null, ipAddress || null]
      );

      return true;
    } catch (error) {
      console.error('点赞墓地错误:', error);
      throw error;
    }
  }

  /**
   * 取消点赞
   */
  static async unlikeGrave(graveId: number, userId?: number, ipAddress?: string): Promise<boolean> {
    try {
      let result;
      if (userId) {
        result = await database.query(
          `DELETE FROM grave_likes WHERE grave_id = ? AND user_id = ?`,
          [graveId, userId]
        );
      } else if (ipAddress) {
        result = await database.query(
          `DELETE FROM grave_likes WHERE grave_id = ? AND ip_address = ?`,
          [graveId, ipAddress]
        );
      }

      return result && result.affectedRows > 0;
    } catch (error) {
      console.error('取消点赞错误:', error);
      throw error;
    }
  }

  /**
   * 获取墓地点赞数
   */
  static async getGraveLikesCount(graveId: number): Promise<number> {
    try {
      const result = await database.query(
        `SELECT COUNT(*) as count FROM grave_likes WHERE grave_id = ?`,
        [graveId]
      );

      return result[0]?.count || 0;
    } catch (error) {
      console.error('获取点赞数错误:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否已点赞
   */
  static async hasUserLikedGrave(graveId: number, userId?: number, ipAddress?: string): Promise<boolean> {
    try {
      let result;
      if (userId) {
        result = await database.query(
          `SELECT COUNT(*) as count FROM grave_likes WHERE grave_id = ? AND user_id = ?`,
          [graveId, userId]
        );
      } else if (ipAddress) {
        result = await database.query(
          `SELECT COUNT(*) as count FROM grave_likes WHERE grave_id = ? AND ip_address = ?`,
          [graveId, ipAddress]
        );
      }

      return result && result[0]?.count > 0;
    } catch (error) {
      console.error('检查点赞状态错误:', error);
      return false;
    }
  }

  /**
   * 发表评论
   */
  static async addComment(
    graveId: number,
    commentText: string,
    userId?: number,
    isAnonymous: boolean = false
  ): Promise<GraveComment> {
    try {
      const result = await database.query(
        `INSERT INTO grave_comments (grave_id, user_id, comment_text, is_anonymous)
         VALUES (?, ?, ?, ?)`,
        [graveId, userId || null, commentText, isAnonymous ? 1 : 0]
      );

      const comment = await database.query(
        `SELECT 
          id, grave_id as graveId, user_id as userId, comment_text as commentText,
          is_anonymous as isAnonymous, likes_count as likesCount,
          created_at as createdAt, updated_at as updatedAt
        FROM grave_comments
        WHERE id = ?`,
        [result.insertId]
      );

      return comment[0];
    } catch (error) {
      console.error('发表评论错误:', error);
      throw error;
    }
  }

  /**
   * 获取墓地的评论
   */
  static async getGraveComments(
    graveId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ comments: GraveComment[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      const countResult = await database.query(
        `SELECT COUNT(*) as total FROM grave_comments WHERE grave_id = ?`,
        [graveId]
      );

      const comments = await database.query(
        `SELECT 
          id, grave_id as graveId, user_id as userId, comment_text as commentText,
          is_anonymous as isAnonymous, likes_count as likesCount,
          created_at as createdAt, updated_at as updatedAt
        FROM grave_comments
        WHERE grave_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [graveId, limit, offset]
      );

      return {
        comments,
        total: countResult[0]?.total || 0
      };
    } catch (error) {
      console.error('获取评论错误:', error);
      throw error;
    }
  }

  /**
   * 点赞评论（免费）
   */
  static async likeComment(
    commentId: number,
    userId?: number,
    ipAddress?: string
  ): Promise<boolean> {
    try {
      await database.query(
        `INSERT INTO comment_likes (comment_id, user_id, ip_address)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE liked_at = CURRENT_TIMESTAMP`,
        [commentId, userId || null, ipAddress || null]
      );

      // 更新评论的点赞数
      await database.query(
        `UPDATE grave_comments 
         SET likes_count = (SELECT COUNT(*) FROM comment_likes WHERE comment_id = ?)
         WHERE id = ?`,
        [commentId, commentId]
      );

      return true;
    } catch (error) {
      console.error('点赞评论错误:', error);
      throw error;
    }
  }

  /**
   * 取消点赞评论
   */
  static async unlikeComment(commentId: number, userId?: number, ipAddress?: string): Promise<boolean> {
    try {
      let result;
      if (userId) {
        result = await database.query(
          `DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
          [commentId, userId]
        );
      } else if (ipAddress) {
        result = await database.query(
          `DELETE FROM comment_likes WHERE comment_id = ? AND ip_address = ?`,
          [commentId, ipAddress]
        );
      }

      if (result && result.affectedRows > 0) {
        // 更新评论的点赞数
        await database.query(
          `UPDATE grave_comments 
           SET likes_count = (SELECT COUNT(*) FROM comment_likes WHERE comment_id = ?)
           WHERE id = ?`,
          [commentId, commentId]
        );
      }

      return result && result.affectedRows > 0;
    } catch (error) {
      console.error('取消点赞评论错误:', error);
      throw error;
    }
  }

  /**
   * 获取评论的点赞数
   */
  static async getCommentLikesCount(commentId: number): Promise<number> {
    try {
      const result = await database.query(
        `SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?`,
        [commentId]
      );

      return result[0]?.count || 0;
    } catch (error) {
      console.error('获取评论点赞数错误:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否已点赞评论
   */
  static async hasUserLikedComment(commentId: number, userId?: number, ipAddress?: string): Promise<boolean> {
    try {
      let result;
      if (userId) {
        result = await database.query(
          `SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ? AND user_id = ?`,
          [commentId, userId]
        );
      } else if (ipAddress) {
        result = await database.query(
          `SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ? AND ip_address = ?`,
          [commentId, ipAddress]
        );
      }

      return result && result[0]?.count > 0;
    } catch (error) {
      console.error('检查评论点赞状态错误:', error);
      return false;
    }
  }

  /**
   * 删除评论（仅评论者或管理员可删除）
   */
  static async deleteComment(commentId: number, userId?: number): Promise<boolean> {
    try {
      const comment = await database.query(
        `SELECT user_id FROM grave_comments WHERE id = ?`,
        [commentId]
      );

      if (!comment || !comment[0]) {
        return false;
      }

      // 检查权限：只有评论者或管理员可删除
      if (comment[0].user_id && comment[0].user_id !== userId) {
        return false;
      }

      const result = await database.query(
        `DELETE FROM grave_comments WHERE id = ?`,
        [commentId]
      );

      return result && result.affectedRows > 0;
    } catch (error) {
      console.error('删除评论错误:', error);
      throw error;
    }
  }

  /**
   * 计算购买鲜花的USDT费用
   */
  static async calculateFlowerCost(flowerType: string, quantity: number): Promise<number | null> {
    try {
      const config = await this.getFlowerConfig(flowerType);
      if (!config) {
        return null;
      }

      return config.usdtPrice * quantity;
    } catch (error) {
      console.error('计算鲜花成本错误:', error);
      throw error;
    }
  }
}
