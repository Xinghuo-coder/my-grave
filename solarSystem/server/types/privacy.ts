/**
 * 隐私权限管理类型定义
 * 
 * 每条坟墓信息可独立配置隐私级别和权限
 */

/**
 * 隐私级别
 */
export enum PrivacyLevel {
  PUBLIC = 'public',           // 完全公开
  PRIVATE = 'private',         // 完全隐私（仅本人可见）
  SELECTIVE = 'selective'      // 选择性公开（特定账号可见）
}

/**
 * 隐私信息字段枚举
 * 坟墓中可配置隐私的所有字段
 */
export enum GraveField {
  // 基础信息
  DECEASED_NAME = 'deceasedName',
  DECEASED_DATE = 'deceasedDate',
  EPITAPH = 'epitaph',
  
  // 详细内容
  LIFE_OVERVIEW = 'lifeOverview',
  SELF_EVALUATION = 'selfEvaluation',
  OTHERS_EVALUATION = 'othersEvaluation',
  INFLUENCE_ON_OTHERS = 'influenceOnOthers',
  WISHES_BEFORE_DEATH = 'wishesBeforeDeath',
  
  // 多媒体
  VIDEO = 'video',
  PHOTOS = 'photos',
  
  // 法律文件
  WILL = 'will',
  INHERITANCE_PLAN = 'inheritancePlan',
  
  // 社交账号
  SOCIAL_ACCOUNTS = 'socialAccounts',
  
  // 其他
  VIEW_COUNT = 'viewCount'
}

/**
 * 隐私级别配置
 * 针对某个字段的隐私设置
 */
export interface FieldPrivacy {
  field: GraveField;
  level: PrivacyLevel;
  
  // 选择性公开的特定账号列表
  allowedUserIds?: number[];
  
  // 时效控制
  expiresAt?: Date;  // 何时自动改为公开
  autoPublicAt?: Date; // 时效过期时间点
}

/**
 * 权限申请
 * 用户申请查看隐私信息
 */
export interface PermissionRequest {
  id?: number;
  graveId: number;
  graveOwnerId: number;  // 坟墓主人 ID
  requesterId: number;   // 申请者 ID
  requesterName?: string; // 申请者名字
  
  field: GraveField;     // 申请查看的字段
  reason?: string;       // 申请原因
  
  status: RequestStatus; // 申请状态
  respondedAt?: Date;    // 回复时间
  respondedBy?: number;  // 回复人 ID
  
  // 授权信息
  grantedUntil?: Date;   // 授权有效期至
  accessCount?: number;  // 访问次数（可选限制）
  accessedCount?: number; // 已访问次数
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 权限申请状态
 */
export enum RequestStatus {
  PENDING = 'pending',      // 待批准
  APPROVED = 'approved',    // 已批准
  REJECTED = 'rejected',    // 已拒绝
  EXPIRED = 'expired'       // 已过期
}

/**
 * 已授权的权限记录
 */
export interface GrantedPermission {
  id?: number;
  graveId: number;
  graveOwnerId: number;
  userId: number;        // 被授权的用户
  
  fields: GraveField[];  // 被授权访问的字段列表
  
  grantedAt: Date;
  grantedBy: number;     // 谁授予的权限
  expiresAt?: Date;      // 权限过期时间
  
  accessHistory?: AccessLog[];  // 访问历史
}

/**
 * 访问日志
 */
export interface AccessLog {
  id?: number;
  permissionId: number;
  userId: number;
  field: GraveField;
  accessedAt: Date;
  ipAddress?: string;
}

/**
 * 坟墓整体隐私配置
 */
export interface GravePrivacyConfig {
  graveId: number;
  userId: number;
  
  // 全局设置
  allowRequestsForPrivate: boolean;  // 是否允许申请查看私密信息
  requireApprovalForEachRequest: boolean; // 每次申请都需要审批
  defaultExpirationDays?: number; // 权限默认过期天数
  
  // 字段级隐私配置
  fieldPrivacies: FieldPrivacy[]; // 每个字段的隐私设置
  
  // 黑名单/白名单
  blockedUsers?: number[];  // 黑名单用户（无法申请）
  trustedUsers?: number[]; // 白名单用户（自动批准申请）
  
  updatedAt: Date;
}

/**
 * 隐私设置请求
 */
export interface SetPrivacyRequest {
  graveId: number;
  field: GraveField;
  level: PrivacyLevel;
  allowedUserIds?: number[];
  expiresAt?: Date;
}

/**
 * 权限申请请求
 */
export interface RequestAccessRequest {
  graveId: number;
  field: GraveField;
  reason?: string;
}

/**
 * 权限审批请求
 */
export interface ApprovePermissionRequest {
  requestId: number;
  approved: boolean;
  reason?: string;  // 拒绝原因
  expiresAt?: Date; // 授权有效期
}

/**
 * 权限申请响应
 */
export interface PermissionRequestResponse {
  success: boolean;
  requestId?: number;
  message: string;
  status?: RequestStatus;
}

/**
 * 隐私检查结果
 */
export interface PrivacyCheckResult {
  canAccess: boolean;
  field: GraveField;
  level: PrivacyLevel;
  hasPermission: boolean;
  permissionExpiry?: Date;
  reason?: string;  // 无法访问的原因
}

/**
 * 隐私统计信息
 */
export interface PrivacyStatistics {
  graveId: number;
  totalFields: number;
  publicFields: number;
  privateFields: number;
  selectiveFields: number;
  pendingRequests: number;
  approvedRequests: number;
  totalPermissions: number;
}
