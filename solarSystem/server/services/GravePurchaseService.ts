/**
 * 墓地购买服务
 * 处理墓地购买、配额管理和交易记录
 */

import database from '../database';

export interface GravePurchaseConfig {
  id: number;
  freeGravesPerUser: number;
  usdtPricePerGrave: number;
  currency: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserGraveQuota {
  id: number;
  userId: number;
  freeGravesAllocated: number;
  purchasedGraves: number;
  totalGravesLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GravePurchaseRecord {
  id: number;
  userId: number;
  quantity: number;
  usdtAmount: number;
  transactionHash?: string;
  blockchainNetwork?: string;
  walletAddress?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'refunded';
  purchaseDate: Date;
  confirmedDate?: Date;
  remarks?: string;
}

export class GravePurchaseService {
  /**
   * 获取墓地购买配置
   */
  static async getConfig(): Promise<GravePurchaseConfig | null> {
    try {
      const result = await database.query(
        `SELECT 
          id, free_graves_per_user as freeGravesPerUser,
          usdt_price_per_grave as usdtPricePerGrave,
          currency, is_enabled as isEnabled,
          created_at as createdAt, updated_at as updatedAt
        FROM grave_purchase_config 
        WHERE is_enabled = true
        LIMIT 1`
      );
      
      return result[0] || null;
    } catch (error) {
      console.error('获取墓地购买配置错误:', error);
      throw error;
    }
  }

  /**
   * 更新墓地购买配置
   */
  static async updateConfig(config: Partial<GravePurchaseConfig>): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (config.freeGravesPerUser !== undefined) {
        updates.push('free_graves_per_user = ?');
        values.push(config.freeGravesPerUser);
      }

      if (config.usdtPricePerGrave !== undefined) {
        updates.push('usdt_price_per_grave = ?');
        values.push(config.usdtPricePerGrave);
      }

      if (config.isEnabled !== undefined) {
        updates.push('is_enabled = ?');
        values.push(config.isEnabled ? 1 : 0);
      }

      if (updates.length === 0) return false;

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const result = await database.query(
        `UPDATE grave_purchase_config SET ${updates.join(', ')} WHERE id = ?`,
        [...values, config.id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新墓地购买配置错误:', error);
      throw error;
    }
  }

  /**
   * 初始化配置（如果不存在则创建默认配置）
   */
  static async initializeConfig(): Promise<GravePurchaseConfig> {
    try {
      const existingConfig = await this.getConfig();
      if (existingConfig) {
        return existingConfig;
      }

      // 创建默认配置：每人免费1块，额外墓地100 USDT
      const result = await database.query(
        `INSERT INTO grave_purchase_config 
         (free_graves_per_user, usdt_price_per_grave, currency, is_enabled)
         VALUES (?, ?, ?, ?)`,
        [1, 100, 'USDT', 1]
      );

      const config = await this.getConfig();
      if (!config) {
        throw new Error('初始化配置失败');
      }

      return config;
    } catch (error) {
      console.error('初始化配置错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户的墓地配额
   */
  static async getUserQuota(userId: number): Promise<UserGraveQuota | null> {
    try {
      const result = await database.query(
        `SELECT 
          id, user_id as userId, free_graves_allocated as freeGravesAllocated,
          purchased_graves as purchasedGraves, total_graves_limit as totalGravesLimit,
          created_at as createdAt, updated_at as updatedAt
        FROM user_grave_quota
        WHERE user_id = ?`,
        [userId]
      );

      return result[0] || null;
    } catch (error) {
      console.error('获取用户配额错误:', error);
      throw error;
    }
  }

  /**
   * 为新用户初始化配额（在注册时调用）
   */
  static async initializeUserQuota(userId: number): Promise<UserGraveQuota> {
    try {
      const config = await this.getConfig() || await this.initializeConfig();
      
      const result = await database.query(
        `INSERT INTO user_grave_quota 
         (user_id, free_graves_allocated, purchased_graves)
         VALUES (?, ?, ?)`,
        [userId, 0, 0]
      );

      const quota = await this.getUserQuota(userId);
      if (!quota) {
        throw new Error('初始化用户配额失败');
      }

      return quota;
    } catch (error) {
      console.error('初始化用户配额错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户可拥有的总墓地数
   */
  static async getUserAvailableGraveSlots(userId: number): Promise<number> {
    try {
      const quota = await this.getUserQuota(userId);
      if (!quota) {
        return 0;
      }

      const config = await this.getConfig() || await this.initializeConfig();
      const totalAvailable = quota.freeGravesAllocated + quota.purchasedGraves;

      // 如果设置了限制，返回限制内的数量
      if (quota.totalGravesLimit) {
        return Math.min(totalAvailable, quota.totalGravesLimit);
      }

      return totalAvailable;
    } catch (error) {
      console.error('获取用户可用墓地数错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户已占用的墓地数
   */
  static async getUserGraveCount(userId: number): Promise<number> {
    try {
      const result = await database.query(
        `SELECT COUNT(*) as count FROM graves WHERE user_id = ?`,
        [userId]
      );

      return result[0]?.count || 0;
    } catch (error) {
      console.error('获取用户墓地数错误:', error);
      throw error;
    }
  }

  /**
   * 分配免费墓地给新用户
   */
  static async allocateFreeGraves(userId: number, quantity: number = 1): Promise<boolean> {
    try {
      const quota = await this.getUserQuota(userId);
      if (!quota) {
        throw new Error('用户配额不存在，请先初始化用户配额');
      }

      const result = await database.query(
        `UPDATE user_grave_quota 
         SET free_graves_allocated = free_graves_allocated + ?
         WHERE user_id = ?`,
        [quantity, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('分配免费墓地错误:', error);
      throw error;
    }
  }

  /**
   * 记录免费墓地分配
   */
  static async recordFreeGraveAllocation(
    userId: number,
    graveId: number | null,
    reason: string = 'account_registration'
  ): Promise<boolean> {
    try {
      await database.query(
        `INSERT INTO free_grave_allocation_records 
         (user_id, grave_id, reason)
         VALUES (?, ?, ?)`,
        [userId, graveId, reason]
      );

      return true;
    } catch (error) {
      console.error('记录免费墓地分配错误:', error);
      throw error;
    }
  }

  /**
   * 验证用户是否可以创建新墓地
   */
  static async canUserCreateGrave(userId: number): Promise<{ allowed: boolean; reason?: string; availableSlots?: number }> {
    try {
      const quota = await this.getUserQuota(userId);
      if (!quota) {
        return {
          allowed: false,
          reason: '用户配额信息不存在'
        };
      }

      const graveCount = await this.getUserGraveCount(userId);
      const availableSlots = quota.freeGravesAllocated + quota.purchasedGraves;

      if (graveCount >= availableSlots) {
        return {
          allowed: false,
          reason: '您已达到可拥有的最大墓地数。请购买更多墓地。',
          availableSlots
        };
      }

      return {
        allowed: true,
        availableSlots: availableSlots - graveCount
      };
    } catch (error) {
      console.error('验证用户是否可以创建墓地错误:', error);
      throw error;
    }
  }

  /**
   * 创建购买订单
   */
  static async createPurchaseRecord(
    userId: number,
    quantity: number,
    usdtAmount: number,
    walletAddress?: string,
    blockchainNetwork?: string
  ): Promise<GravePurchaseRecord> {
    try {
      const result = await database.query(
        `INSERT INTO grave_purchase_records 
         (user_id, quantity, usdt_amount, wallet_address, blockchain_network, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, quantity, usdtAmount, walletAddress || null, blockchainNetwork || null, 'pending']
      );

      const record = await this.getPurchaseRecord(result.insertId);
      if (!record) {
        throw new Error('创建购买记录失败');
      }

      return record;
    } catch (error) {
      console.error('创建购买订单错误:', error);
      throw error;
    }
  }

  /**
   * 获取购买记录
   */
  static async getPurchaseRecord(recordId: number): Promise<GravePurchaseRecord | null> {
    try {
      const result = await database.query(
        `SELECT 
          id, user_id as userId, quantity, usdt_amount as usdtAmount,
          transaction_hash as transactionHash, blockchain_network as blockchainNetwork,
          wallet_address as walletAddress, status,
          purchase_date as purchaseDate, confirmed_date as confirmedDate,
          remarks
        FROM grave_purchase_records
        WHERE id = ?`,
        [recordId]
      );

      return result[0] || null;
    } catch (error) {
      console.error('获取购买记录错误:', error);
      throw error;
    }
  }

  /**
   * 更新购买记录状态
   */
  static async updatePurchaseRecordStatus(
    recordId: number,
    status: 'processing' | 'confirmed' | 'failed' | 'refunded',
    transactionHash?: string
  ): Promise<boolean> {
    try {
      const updates = ['status = ?'];
      const values: any[] = [status];

      if (transactionHash) {
        updates.push('transaction_hash = ?');
        values.push(transactionHash);
      }

      if (status === 'confirmed') {
        updates.push('confirmed_date = CURRENT_TIMESTAMP');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(recordId);

      const result = await database.query(
        `UPDATE grave_purchase_records SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('更新购买记录状态错误:', error);
      throw error;
    }
  }

  /**
   * 确认购买（更新用户配额）
   */
  static async confirmPurchase(recordId: number): Promise<boolean> {
    try {
      const record = await this.getPurchaseRecord(recordId);
      if (!record) {
        throw new Error('购买记录不存在');
      }

      if (record.status !== 'pending' && record.status !== 'processing') {
        throw new Error('购买记录状态不允许确认');
      }

      // 更新购买记录状态
      await this.updatePurchaseRecordStatus(recordId, 'confirmed');

      // 更新用户配额
      const result = await database.query(
        `UPDATE user_grave_quota 
         SET purchased_graves = purchased_graves + ?
         WHERE user_id = ?`,
        [record.quantity, record.userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('确认购买错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户的购买历史
   */
  static async getUserPurchaseHistory(userId: number, limit: number = 50): Promise<GravePurchaseRecord[]> {
    try {
      const result = await database.query(
        `SELECT 
          id, user_id as userId, quantity, usdt_amount as usdtAmount,
          transaction_hash as transactionHash, blockchain_network as blockchainNetwork,
          wallet_address as walletAddress, status,
          purchase_date as purchaseDate, confirmed_date as confirmedDate,
          remarks
        FROM grave_purchase_records
        WHERE user_id = ?
        ORDER BY purchase_date DESC
        LIMIT ?`,
        [userId, limit]
      );

      return result;
    } catch (error) {
      console.error('获取用户购买历史错误:', error);
      throw error;
    }
  }

  /**
   * 计算购买价格
   */
  static async calculatePurchasePrice(quantity: number): Promise<{ quantity: number; unitPrice: number; totalPrice: number } | null> {
    try {
      const config = await this.getConfig() || await this.initializeConfig();
      if (!config || !config.isEnabled) {
        return null;
      }

      return {
        quantity,
        unitPrice: Number(config.usdtPricePerGrave),
        totalPrice: quantity * Number(config.usdtPricePerGrave)
      };
    } catch (error) {
      console.error('计算购买价格错误:', error);
      throw error;
    }
  }
}
