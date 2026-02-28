/**
 * 鲜花系统类型定义
 */

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

export interface GraveLike {
  id: number;
  graveId: number;
  userId?: number;
  ipAddress?: string;
  likedAt: Date;
}

export interface CommentLike {
  id: number;
  commentId: number;
  userId?: number;
  ipAddress?: string;
  likedAt: Date;
}

export interface UserFlowerPurchase {
  id: number;
  userId: number;
  flowerType: string;
  quantity: number;
  usdtAmount: number;
  purchaseDate: Date;
}

export interface FlowerStats {
  [flowerType: string]: number;
}

export interface GraveFlowerResponse {
  flowers: FlowerDonation[];
  stats: FlowerStats;
  total: number;
}

export interface GraveCommentsResponse {
  comments: GraveComment[];
  total: number;
}

export interface LikesResponse {
  likesCount: number;
  hasLiked: boolean;
}

export interface FlowerConfigResponse {
  success: boolean;
  data: FlowerConfig[];
}

export interface FlowerDonationRequest {
  flowerType: string;
  quantity: number;
  message?: string;
}

export interface ConfirmFlowerRequest {
  orderId: number;
  message?: string;
}

export interface CommentRequest {
  commentText: string;
  isAnonymous?: boolean;
}
