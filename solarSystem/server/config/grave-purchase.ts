/**
 * 墓地购买系统配置
 * 包含免费墓地数、USDT价格等可配置的参数
 */

export interface GraveSystemConfig {
  // 免费墓地配置
  freeGravesPerUser: number;          // 每个用户免费可获得的墓地数，默认：1
  
  // USDT购买配置
  usdtPricePerGrave: number;          // 每块额外墓地的USDT价格，默认：100
  
  // 支付配置
  supportedNetworks: string[];        // 支持的区块链网络，如 ['Ethereum', 'Tron', 'Polygon']
  walletValidation: boolean;          // 是否验证钱包地址格式
  
  // 购买限制
  maxGravesPerUser?: number;          // 单个用户最多可拥有的墓地数（可选，无限制留空）
  minPurchaseQuantity: number;        // 最小购买数量
  maxPurchaseQuantity: number;        // 最大购买数量
  
  // 系统开关
  purchaseEnabled: boolean;           // 是否启用购买功能
  autoConfirm: boolean;               // 是否自动确认购买（仅用于测试）
}

/**
 * 默认配置
 */
export const DEFAULT_GRAVE_CONFIG: GraveSystemConfig = {
  freeGravesPerUser: 1,
  usdtPricePerGrave: 100,
  supportedNetworks: ['Ethereum', 'Tron', 'Polygon'],
  walletValidation: true,
  minPurchaseQuantity: 1,
  maxPurchaseQuantity: 100,
  purchaseEnabled: true,
  autoConfirm: false
};

/**
 * 环境特定配置
 */
export const ENVIRONMENT_CONFIGS: Record<string, GraveSystemConfig> = {
  development: {
    ...DEFAULT_GRAVE_CONFIG,
    autoConfirm: true,  // 开发环境自动确认
    usdtPricePerGrave: 1  // 开发环境便宜价格用于测试
  },
  production: {
    ...DEFAULT_GRAVE_CONFIG,
    autoConfirm: false,
    usdtPricePerGrave: 100
  },
  staging: {
    ...DEFAULT_GRAVE_CONFIG,
    autoConfirm: false,
    usdtPricePerGrave: 10  // 测试环境价格
  }
};

/**
 * 获取当前环境的配置
 */
export function getGraveConfig(): GraveSystemConfig {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENT_CONFIGS[env] || DEFAULT_GRAVE_CONFIG;
}

/**
 * 验证钱包地址（简单验证）
 */
export function validateWalletAddress(address: string, network?: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const trimmed = address.trim();

  // Ethereum/Polygon 地址格式（0x开头，40个十六进制字符）
  if (!network || network.toLowerCase().includes('ethereum') || network.toLowerCase().includes('polygon')) {
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return true;
    }
  }

  // Tron 地址格式（T开头，34个字符）
  if (!network || network.toLowerCase().includes('tron')) {
    if (/^T[1-9A-HJ-NP-Z]{33}$/.test(trimmed)) {
      return true;
    }
  }

  // 如果未指定网络，进行通用检查
  return trimmed.length >= 20 && trimmed.length <= 100;
}

/**
 * 验证购买数量
 */
export function validatePurchaseQuantity(quantity: number, config: GraveSystemConfig): { valid: boolean; error?: string } {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      valid: false,
      error: '购买数量必须是正整数'
    };
  }

  if (quantity < config.minPurchaseQuantity) {
    return {
      valid: false,
      error: `最少购买 ${config.minPurchaseQuantity} 个`
    };
  }

  if (quantity > config.maxPurchaseQuantity) {
    return {
      valid: false,
      error: `最多购买 ${config.maxPurchaseQuantity} 个`
    };
  }

  return { valid: true };
}

/**
 * 计算购买总价
 */
export function calculateTotalPrice(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}
