/**
 * 地块数据模型
 * 地球表面被划分为约1.27亿个4平方米的地块
 */

export interface GraveBlock {
  id: number;
  blockCode: string;                 // 地块编号（唯一识别）
  latitude: number;                  // 纬度
  longitude: number;                 // 经度
  
  graveId?: number;                  // 关联的坟墓ID（如果有的话）
  isOccupied: boolean;               // 是否已被占用
  
  createdAt: Date;
  updatedAt: Date;
}

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
