/**
 * 支付相关数据库架构定义
 * 包含墓地购买配置和交易记录
 */

// 墓地购买配置表
export const GRAVE_PURCHASE_CONFIG_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_purchase_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  free_graves_per_user INT DEFAULT 1 COMMENT '每个用户免费可获得的墓地数量',
  usdt_price_per_grave DECIMAL(18, 6) COMMENT '每块额外墓地的USDT价格',
  
  currency VARCHAR(10) DEFAULT 'USDT' COMMENT '购买货币类型',
  is_enabled BOOLEAN DEFAULT true COMMENT '是否启用购买功能',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='墓地购买配置表，用于配置免费墓地数和USDT价格';
`;

// 用户墓地配额表
export const USER_GRAVE_QUOTA_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS user_grave_quota (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  
  free_graves_allocated INT DEFAULT 0 COMMENT '已分配的免费墓地数',
  purchased_graves INT DEFAULT 0 COMMENT '已购买的墓地数',
  total_graves_limit INT COMMENT '总墓地限制（可选，为NULL则无限制）',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='用户墓地配额表，记录每个用户的免费和已购买墓地数';
`;

// 墓地购买交易记录表
export const GRAVE_PURCHASE_RECORD_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_purchase_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  
  quantity INT NOT NULL DEFAULT 1 COMMENT '购买的墓地数量',
  usdt_amount DECIMAL(18, 6) NOT NULL COMMENT '支付的USDT金额',
  
  transaction_hash VARCHAR(255) COMMENT '区块链交易哈希',
  blockchain_network VARCHAR(50) COMMENT '区块链网络（如 Ethereum, Tron等）',
  wallet_address VARCHAR(255) COMMENT '用户的钱包地址',
  
  status ENUM('pending', 'processing', 'confirmed', 'failed', 'refunded') DEFAULT 'pending' COMMENT '交易状态',
  
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '购买日期',
  confirmed_date TIMESTAMP COMMENT '确认日期',
  
  remarks TEXT COMMENT '备注',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_transaction_hash (transaction_hash),
  INDEX idx_purchase_date (purchase_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='墓地购买交易记录表，记录所有USDT购买交易';
`;

// 免费墓地分配记录表
export const FREE_GRAVE_ALLOCATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS free_grave_allocation_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  grave_id INT COMMENT '分配的墓地ID',
  
  allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  reason VARCHAR(255) DEFAULT 'account_registration' COMMENT '分配原因（如：注册账户）',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_allocated_at (allocated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='免费墓地分配记录表';
`;

export const ALL_PAYMENT_MIGRATIONS = [
  GRAVE_PURCHASE_CONFIG_TABLE_SQL,
  USER_GRAVE_QUOTA_TABLE_SQL,
  GRAVE_PURCHASE_RECORD_TABLE_SQL,
  FREE_GRAVE_ALLOCATION_TABLE_SQL,
];
