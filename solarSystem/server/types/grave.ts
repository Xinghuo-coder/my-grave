/**
 * 坟墓数据模型
 */

export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  uploadedAt: Date;
  description?: string;
}

export interface SocialAccount {
  platform: string;  // 'wechat', 'qq', 'weibo', 'douyin', 'bilibili' 等
  username: string;
  profileUrl?: string;
}

export interface GraveInfo {
  // 基础信息
  id: number;
  userId: number;                    // 墓主人用户ID
  graveBlockId: number;              // 地块ID

  // 人物信息
  deceasedName: string;              // 墓主人名字
  deceasedBirthDate?: Date;          // 出生日期
  deceasedDeathDate?: Date;          // 去世日期
  deceasedAge?: number;              // 年龄

  // 墓志铭和文字内容
  epitaph: string;                   // 墓志铭（简短，可以在3D地块上显示）
  lifeOverview: string;              // 生平概述（详细的人生经历）
  selfEvaluation: string;            // 自我评价（本人对自己的评价）
  othersEvaluation: string;          // 他人评价（他人对逝者的评价）
  influenceOnOthers: string;         // 对周围的影响（对周围人的影响）
  wishesBeforeDeath: string[];       // 死前愿望清单（数组，可多条）

  // 多媒体内容
  video?: MediaFile;                 // 个人视频（1个）
  photos: MediaFile[];               // 图片（最多5张）

  // 法律文件
  will?: string;                     // 遗嘱（文本内容或文件URL）
  willDocUrl?: string;               // 遗嘱文档URL
  inheritancePlan?: string;          // 遗产分配方案
  inheritancePlanUrl?: string;       // 遗产分配文档URL

  // 社交账号
  socialAccounts: SocialAccount[];   // 社交账号链接

  // 访问控制
  isPublic: boolean;                 // 是否公开（游客可见）
  allowComments: boolean;            // 是否允许评论
  allowSharing: boolean;             // 是否允许分享

  // 元数据
  createdAt: Date;                   // 创建时间
  updatedAt: Date;                   // 更新时间
  viewCount: number;                 // 浏览次数
  lastViewedAt?: Date;               // 最后浏览时间
}

/**
 * 坟墓创建请求
 */
export interface CreateGraveRequest {
  deceasedName: string;
  epitaph: string;
  lifeOverview: string;
  selfEvaluation?: string;
  othersEvaluation?: string;
  influenceOnOthers?: string;
  wishesBeforeDeath?: string[];
  graveBlockId: number;
  isPublic?: boolean;
}

/**
 * 坟墓更新请求
 */
export interface UpdateGraveRequest {
  deceasedName?: string;
  epitaph?: string;
  lifeOverview?: string;
  selfEvaluation?: string;
  othersEvaluation?: string;
  influenceOnOthers?: string;
  wishesBeforeDeath?: string[];
  will?: string;
  inheritancePlan?: string;
  socialAccounts?: SocialAccount[];
  isPublic?: boolean;
  allowComments?: boolean;
  allowSharing?: boolean;
}

/**
 * 坟墓查询响应
 */
export interface GraveDetailResponse {
  success: boolean;
  data?: GraveInfo;
  message?: string;
}

export interface GraveListResponse {
  success: boolean;
  data?: {
    graves: GraveInfo[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}
