/**
 * 地块数据模型
 * 地球表面被划分为约1.27亿个4平方米的地块
 * 
 * 注意：系统保留地块编号的前5%和后5%，用户只能在中间90%的地块创建坟墓
 */

export interface GraveBlock {
  id: number;
  blockCode: string;                 // 地块编号（唯一识别）
  latitude: number;                  // 纬度
  longitude: number;                 // 经度
  
  graveId?: number;                  // 关联的坟墓ID（如果有的话）
  isOccupied: boolean;               // 是否已被占用
  isReserved: boolean;               // 是否为保留地块（前5%或后5%）
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 地块编号范围管理（系统常量）
 */
export const BLOCK_RANGE_CONFIG = {
  MIN_BLOCK_ID: 1,
  MAX_BLOCK_ID: 127000000,           // 约1.27亿个地块
  RESERVED_PERCENTAGE: 5,             // 前5%和后5%保留
  
  // 计算保留范围
  getReservedRanges() {
    const total = this.MAX_BLOCK_ID - this.MIN_BLOCK_ID + 1;
    const reservedCount = Math.floor(total * (this.RESERVED_PERCENTAGE / 100));
    
    return {
      minReserved: this.MIN_BLOCK_ID,
      maxReserved1: this.MIN_BLOCK_ID + reservedCount - 1,
      minReserved2: this.MAX_BLOCK_ID - reservedCount + 1,
      maxReserved2: this.MAX_BLOCK_ID,
      userMin: this.MIN_BLOCK_ID + reservedCount,
      userMax: this.MAX_BLOCK_ID - reservedCount
    };
  },
  
  // 判断地块是否被保留
  isBlockReserved(blockId: number): boolean {
    const ranges = this.getReservedRanges();
    return (
      (blockId >= ranges.minReserved && blockId <= ranges.maxReserved1) ||
      (blockId >= ranges.minReserved2 && blockId <= ranges.maxReserved2)
    );
  },
  
  // 判断地块ID是否在用户可用范围内
  isBlockAvailableForUser(blockId: number): boolean {
    const ranges = this.getReservedRanges();
    return blockId >= ranges.userMin && blockId <= ranges.userMax;
  }
};

/**
 * 地块搜索请求
 */
export interface BlockSearchRequest {
  blockCode?: string;                // 按地块编号搜索
  latitude?: number;
  longitude?: number;
  radius?: number;                   // 搜索半径（米）
  isOccupied?: boolean;              // 只搜索未被占用的地块
}

/**
 * 地块详情响应
 */
export interface BlockDetailResponse {
  success: boolean;
  data?: {
    block: GraveBlock;
    grave?: any;                      // 如果有坟墓，返回坟墓信息
    isAccessible: boolean;            // 当前用户是否有权访问此地块的坟墓
  };
  message?: string;
}
