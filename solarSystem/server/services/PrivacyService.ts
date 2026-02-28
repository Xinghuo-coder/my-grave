/**
 * 隐私权限管理服务
 */

import type {
  GraveField,
  FieldPrivacy,
  PermissionRequest,
  GrantedPermission,
  GravePrivacyConfig,
  PrivacyLevel,
  PrivacyCheckResult,
  RequestStatus
} from '../types/privacy';
import { PrivacyLevel, RequestStatus } from '../types/privacy';

export class PrivacyService {
  /**
   * 检查用户是否可以访问特定字段
   */
  static checkFieldAccess(
    graveOwnerId: number,
    viewerId: number | null,
    fieldPrivacy: FieldPrivacy,
    hasApprovedPermission: boolean = false
  ): PrivacyCheckResult {
    // 坟墓主人总是可以访问自己的信息
    if (graveOwnerId === viewerId) {
      return {
        canAccess: true,
        field: fieldPrivacy.field,
        level: fieldPrivacy.level,
        hasPermission: true
      };
    }

    // 检查时效
    if (fieldPrivacy.expiresAt && new Date() > fieldPrivacy.expiresAt) {
      // 时效已过，自动改为公开
      fieldPrivacy.level = PrivacyLevel.PUBLIC;
    }

    // 完全公开
    if (fieldPrivacy.level === PrivacyLevel.PUBLIC) {
      return {
        canAccess: true,
        field: fieldPrivacy.field,
        level: fieldPrivacy.level,
        hasPermission: true
      };
    }

    // 完全隐私
    if (fieldPrivacy.level === PrivacyLevel.PRIVATE) {
      return {
        canAccess: false,
        field: fieldPrivacy.field,
        level: fieldPrivacy.level,
        hasPermission: hasApprovedPermission,
        reason: hasApprovedPermission ? undefined : '该信息为隐私内容，您没有访问权限'
      };
    }

    // 选择性公开
    if (fieldPrivacy.level === PrivacyLevel.SELECTIVE) {
      const hasAccess = fieldPrivacy.allowedUserIds?.includes(viewerId ?? -1) ?? false;
      
      if (hasAccess) {
        return {
          canAccess: true,
          field: fieldPrivacy.field,
          level: fieldPrivacy.level,
          hasPermission: true
        };
      }

      // 检查是否有已批准的权限
      if (hasApprovedPermission) {
        return {
          canAccess: true,
          field: fieldPrivacy.field,
          level: fieldPrivacy.level,
          hasPermission: true
        };
      }

      return {
        canAccess: false,
        field: fieldPrivacy.field,
        level: fieldPrivacy.level,
        hasPermission: false,
        reason: '该信息已限制，您可以申请查看权限'
      };
    }

    return {
      canAccess: false,
      field: fieldPrivacy.field,
      level: fieldPrivacy.level,
      hasPermission: false,
      reason: '无法访问此信息'
    };
  }

  /**
   * 验证权限申请
   */
  static validatePermissionRequest(
    graveOwnerId: number,
    requesterId: number,
    reason?: string
  ): { valid: boolean; error?: string } {
    // 自己不能申请自己的权限
    if (graveOwnerId === requesterId) {
      return {
        valid: false,
        error: '您是坟墓主人，无需申请权限'
      };
    }

    // 验证申请原因（可选，但建议有）
    if (!reason || reason.trim().length === 0) {
      // 允许无原因申请，但返回警告
      console.warn('权限申请没有提供原因');
    }

    if (reason && reason.length > 500) {
      return {
        valid: false,
        error: '申请原因长度不能超过500个字符'
      };
    }

    return { valid: true };
  }

  /**
   * 检查请求是否应该自动批准
   */
  static shouldAutoApprove(
    graveConfig: GravePrivacyConfig,
    requesterId: number
  ): boolean {
    // 白名单用户自动批准
    if (graveConfig.trustedUsers?.includes(requesterId)) {
      return true;
    }

    return false;
  }

  /**
   * 检查用户是否被黑名单
   */
  static isUserBlocked(
    graveConfig: GravePrivacyConfig,
    userId: number
  ): boolean {
    return graveConfig.blockedUsers?.includes(userId) ?? false;
  }

  /**
   * 检查是否可以申请权限
   */
  static canRequestPermission(
    graveConfig: GravePrivacyConfig,
    fieldPrivacy: FieldPrivacy,
    requesterId: number
  ): { canRequest: boolean; reason?: string } {
    // 检查黑名单
    if (this.isUserBlocked(graveConfig, requesterId)) {
      return {
        canRequest: false,
        reason: '您已被该坟墓主人加入黑名单'
      };
    }

    // 公开字段不需要申请
    if (fieldPrivacy.level === PrivacyLevel.PUBLIC) {
      return {
        canRequest: false,
        reason: '该信息已公开，无需申请'
      };
    }

    // 检查是否允许申请私密信息
    if (fieldPrivacy.level === PrivacyLevel.PRIVATE && !graveConfig.allowRequestsForPrivate) {
      return {
        canRequest: false,
        reason: '坟墓主人不允许申请此信息'
      };
    }

    return { canRequest: true };
  }

  /**
   * 计算权限过期时间
   */
  static calculateExpiryDate(daysFromNow?: number): Date | undefined {
    if (!daysFromNow || daysFromNow <= 0) {
      return undefined;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysFromNow);
    return expiryDate;
  }

  /**
   * 检查权限是否已过期
   */
  static isPermissionExpired(permission: GrantedPermission): boolean {
    if (!permission.expiresAt) {
      return false;
    }
    return new Date() > permission.expiresAt;
  }

  /**
   * 检查字段隐私是否已过期
   */
  static isFieldPrivacyExpired(fieldPrivacy: FieldPrivacy): boolean {
    if (!fieldPrivacy.expiresAt) {
      return false;
    }
    return new Date() > fieldPrivacy.expiresAt;
  }

  /**
   * 处理过期的隐私配置
   * 将过期的隐私字段改为公开
   */
  static handleExpiredPrivacy(fieldPrivacy: FieldPrivacy): FieldPrivacy {
    if (this.isFieldPrivacyExpired(fieldPrivacy)) {
      fieldPrivacy.level = PrivacyLevel.PUBLIC;
      fieldPrivacy.expiresAt = undefined;
    }
    return fieldPrivacy;
  }

  /**
   * 验证权限批准请求
   */
  static validateApproval(
    permission: GrantedPermission,
    expiresAt?: Date
  ): { valid: boolean; error?: string } {
    // 验证过期时间
    if (expiresAt) {
      const now = new Date();
      if (expiresAt < now) {
        return {
          valid: false,
          error: '过期时间不能早于当前时间'
        };
      }

      // 不允许设置超过1年的权限
      const maxExpiry = new Date();
      maxExpiry.setFullYear(maxExpiry.getFullYear() + 1);
      if (expiresAt > maxExpiry) {
        return {
          valid: false,
          error: '权限有效期不能超过1年'
        };
      }
    }

    return { valid: true };
  }

  /**
   * 计算隐私统计信息
   */
  static calculatePrivacyStats(fieldPrivacies: FieldPrivacy[]) {
    const stats = {
      totalFields: fieldPrivacies.length,
      publicFields: 0,
      privateFields: 0,
      selectiveFields: 0,
      expiredFields: 0
    };

    fieldPrivacies.forEach(fp => {
      if (this.isFieldPrivacyExpired(fp)) {
        stats.expiredFields++;
      }

      switch (fp.level) {
        case PrivacyLevel.PUBLIC:
          stats.publicFields++;
          break;
        case PrivacyLevel.PRIVATE:
          stats.privateFields++;
          break;
        case PrivacyLevel.SELECTIVE:
          stats.selectiveFields++;
          break;
      }
    });

    return stats;
  }

  /**
   * 批量检查字段访问权限
   */
  static checkMultipleFieldAccess(
    graveOwnerId: number,
    viewerId: number | null,
    fieldPrivacies: FieldPrivacy[],
    approvedPermissions: GrantedPermission[] = []
  ): Map<GraveField, PrivacyCheckResult> {
    const results = new Map<GraveField, PrivacyCheckResult>();

    fieldPrivacies.forEach(fp => {
      // 检查是否有已批准的权限
      const hasApproved = approvedPermissions.some(
        perm => perm.fields.includes(fp.field) && !this.isPermissionExpired(perm)
      );

      const result = this.checkFieldAccess(
        graveOwnerId,
        viewerId,
        fp,
        hasApproved
      );

      results.set(fp.field, result);
    });

    return results;
  }

  /**
   * 过滤坟墓字段（基于访问权限）
   */
  static filterGraveFields(
    graveData: any,
    accessResults: Map<any, PrivacyCheckResult>
  ): any {
    const filtered: any = {};

    Object.keys(graveData).forEach(key => {
      const accessResult = accessResults.get(key);
      
      if (!accessResult || accessResult.canAccess) {
        filtered[key] = graveData[key];
      }
    });

    return filtered;
  }

  /**
   * 生成权限摘要（用于显示给用户）
   */
  static generatePermissionSummary(
    permission: GrantedPermission
  ): {
    fields: GraveField[];
    grantedAt: string;
    expiresAt?: string;
    isExpired: boolean;
    daysRemaining?: number;
  } {
    const isExpired = permission.expiresAt ? new Date() > permission.expiresAt : false;
    let daysRemaining: number | undefined;

    if (permission.expiresAt && !isExpired) {
      const now = new Date();
      const diff = permission.expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      fields: permission.fields,
      grantedAt: permission.grantedAt.toISOString(),
      expiresAt: permission.expiresAt?.toISOString(),
      isExpired,
      daysRemaining
    };
  }
}
