/**
 * 坟墓业务逻辑服务
 */

import type { GraveInfo, CreateGraveRequest, UpdateGraveRequest, SocialAccount } from '../types/grave';
import type { GraveBlock } from '../types/block';
import { BLOCK_RANGE_CONFIG } from '../types/block';
import { UserRole } from '../types/user';
import { GraveEncryptionService } from './GraveEncryptionService';

export class GraveService {
  /**
   * 验证是否可以创建坟墓
   */
  static validateCanCreateGrave(role: UserRole, userGraveCount: number, blockId?: number): { valid: boolean; error?: string } {
    if (role !== UserRole.USER) {
      return {
        valid: false,
        error: '只有正式用户才能创建坟墓。请先登录或注册账号。'
      };
    }

    if (userGraveCount >= 1) {
      return {
        valid: false,
        error: '每个账号只能创建一个坟墓。'
      };
    }

    // 验证地块是否在保留范围内
    if (blockId !== undefined && !BLOCK_RANGE_CONFIG.isBlockAvailableForUser(blockId)) {
      return {
        valid: false,
        error: '选择的地块被保留，不对用户开放。请选择其他地块。'
      };
    }

    return { valid: true };
  }

  /**
   * 验证坟墓信息的完整性
   */
  static validateGraveInfo(data: CreateGraveRequest | UpdateGraveRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.deceasedName || data.deceasedName.trim().length === 0) {
      errors.push('墓主人名字不能为空');
    }

    if (!data.epitaph || data.epitaph.trim().length === 0) {
      errors.push('墓志铭不能为空');
    } else if (data.epitaph.length > 200) {
      errors.push('墓志铭长度不能超过200字');
    }

    if (!data.lifeOverview || data.lifeOverview.trim().length === 0) {
      errors.push('生平概述不能为空');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证多媒体内容
   */
  static validateMedia(videoCount: number, photoCount: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (videoCount > 1) {
      errors.push('最多只能上传1个视频');
    }

    if (photoCount > 5) {
      errors.push('最多只能上传5张图片');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证社交账号
   */
  static validateSocialAccounts(accounts: SocialAccount[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validPlatforms = ['wechat', 'qq', 'weibo', 'douyin', 'bilibili', 'instagram', 'twitter', 'facebook'];

    accounts.forEach((account, index) => {
      if (!account.platform || !validPlatforms.includes(account.platform)) {
        errors.push(`社交账号 ${index + 1}: 不支持的平台类型`);
      }

      if (!account.username || account.username.trim().length === 0) {
        errors.push(`社交账号 ${index + 1}: 用户名不能为空`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 检查用户是否有权编辑坟墓
   */
  static canUserEditGrave(userId: number, graveOwnerId: number): boolean {
    return userId === graveOwnerId;
  }

  /**
   * 检查用户是否有权查看坟墓的私密内容
   */
  static canViewPrivateContent(userId: number | null, graveOwnerId: number, isPublic: boolean): boolean {
    // 如果是公开坟墓，任何人都可以查看
    if (isPublic) {
      return true;
    }

    // 如果是私密坟墓，只有主人可以查看
    if (!userId) {
      return false;
    }

    return userId === graveOwnerId;
  }

  /**
   * 过滤坟墓内容（根据权限）
   */
  static filterGraveContent(grave: GraveInfo, userId: number | null, role: string): Partial<GraveInfo> {
    const canViewPrivate = this.canViewPrivateContent(userId, grave.userId, grave.isPublic);

    const filtered: Partial<GraveInfo> = {
      id: grave.id,
      userId: grave.userId,
      deceasedName: grave.deceasedName,
      epitaph: grave.epitaph,
      viewCount: grave.viewCount,
      createdAt: grave.createdAt,
      isPublic: grave.isPublic,
    };

    // 只有公开或本人可以查看详细信息
    if (canViewPrivate) {
      filtered.lifeOverview = grave.lifeOverview;
      filtered.selfEvaluation = grave.selfEvaluation;
      filtered.othersEvaluation = grave.othersEvaluation;
      filtered.influenceOnOthers = grave.influenceOnOthers;
      filtered.wishesBeforeDeath = grave.wishesBeforeDeath;
      filtered.photos = grave.photos;
      filtered.video = grave.video;
      filtered.socialAccounts = grave.socialAccounts;
      filtered.will = grave.will;
      filtered.inheritancePlan = grave.inheritancePlan;
    }

    return filtered;
  }

  /**
   * 验证地块是否对用户可用
   */
  static validateBlockAvailability(block: GraveBlock): { valid: boolean; error?: string } {
    if (block.isReserved) {
      return {
        valid: false,
        error: '该地块为保留地块，不对用户开放。'
      };
    }

    if (block.isOccupied) {
      return {
        valid: false,
        error: '该地块已被占用，请选择其他地块。'
      };
    }

    return { valid: true };
  }

  /**
   * 计算坟墓的完整度（百分比）
   */
  static calculateCompletion(grave: GraveInfo): number {
    let completion = 0;
    let totalFields = 0;

    const fields = [
      { value: grave.epitaph, weight: 1 },
      { value: grave.lifeOverview, weight: 1 },
      { value: grave.selfEvaluation, weight: 1 },
      { value: grave.othersEvaluation, weight: 1 },
      { value: grave.influenceOnOthers, weight: 1 },
      { value: grave.wishesBeforeDeath, weight: 0.5 },
      { value: grave.photos, weight: 0.5 },
      { value: grave.video, weight: 0.5 },
      { value: grave.will, weight: 0.5 },
      { value: grave.inheritancePlan, weight: 0.5 },
      { value: grave.socialAccounts, weight: 0.3 },
    ];

    fields.forEach(field => {
      totalFields += field.weight;
      if (field.value && (Array.isArray(field.value) ? field.value.length > 0 : true)) {
        completion += field.weight;
      }
    });

    return Math.round((completion / totalFields) * 100);
  }

  /**
   * 存储前：按账号对坟墓信息进行独立加密
   */
  static encryptGraveForStorage<T extends object>(userId: number, graveData: T): T {
    return GraveEncryptionService.encryptGravePayload(userId, graveData as Record<string, unknown>) as T;
  }

  /**
   * 读取后：按账号对坟墓信息进行解密
   */
  static decryptGraveFromStorage<T extends object>(userId: number, encryptedGraveData: T): T {
    return GraveEncryptionService.decryptGravePayload(userId, encryptedGraveData as Record<string, unknown>) as T;
  }
}
