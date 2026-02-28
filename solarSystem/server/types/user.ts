/**
 * 用户类型定义
 */

export enum UserRole {
  GUEST = 'guest',           // 游客（免登录）
  USER = 'user'              // 正式用户（有账号）
}

export interface UserSession {
  userId?: number;
  username?: string;
  email?: string;
  role: UserRole;
  isVerified?: boolean;
}

/**
 * 游客权限
 */
export const GUEST_PERMISSIONS = {
  VIEW_PUBLIC_INFO: true,     // 可以查看公开信息
  CREATE_GRAVE: false,        // 不可以创建坟墓
  EDIT_GRAVE: false,          // 不可以编辑坟墓
  DELETE_GRAVE: false,        // 不可以删除坟墓
  VIEW_GRAVE_DETAILS: true,   // 可以查看坟墓详情
} as const;

/**
 * 正式用户权限
 */
export const USER_PERMISSIONS = {
  VIEW_PUBLIC_INFO: true,     // 可以查看公开信息
  CREATE_GRAVE: true,         // 可以创建坟墓（每个账号一个）
  EDIT_GRAVE: true,           // 可以编辑自己的坟墓
  DELETE_GRAVE: true,         // 可以删除自己的坟墓
  VIEW_GRAVE_DETAILS: true,   // 可以查看坟墓详情
  VIEW_PRIVATE_CONTENT: true, // 可以查看私密内容
} as const;

/**
 * 权限验证函数
 */
export function hasPermission(role: UserRole, permission: keyof typeof GUEST_PERMISSIONS): boolean {
  if (role === UserRole.GUEST) {
    return GUEST_PERMISSIONS[permission];
  }
  if (role === UserRole.USER) {
    return USER_PERMISSIONS[permission];
  }
  return false;
}

export function canCreateGrave(role: UserRole): boolean {
  return hasPermission(role, 'CREATE_GRAVE');
}

export function canEditGrave(role: UserRole): boolean {
  return hasPermission(role, 'EDIT_GRAVE');
}

export function canViewPublicInfo(role: UserRole): boolean {
  return hasPermission(role, 'VIEW_PUBLIC_INFO');
}
