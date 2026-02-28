/**
 * 墓地购买系统相关类型定义
 */

export interface PurchaseConfig {
  id: number;
  freeGravesPerUser: number;
  usdtPricePerGrave: number;
  currency: string;
  isEnabled: boolean;
}

export interface UserGraveQuota {
  userId: number;
  freeGravesAllocated: number;
  purchasedGraves: number;
  totalAvailableSlots: number;
  usedSlots: number;
  remainingSlots: number;
  canCreateMore: boolean;
}

export interface PurchaseOrder {
  id: number;
  userId: number;
  quantity: number;
  usdtAmount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'refunded';
  transactionHash?: string;
  blockchainNetwork?: string;
  walletAddress?: string;
  purchaseDate: Date;
  confirmedDate?: Date;
  remarks?: string;
}

export interface PricingInfo {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
