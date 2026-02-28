#!/bin/bash

# 墓地购买系统数据库迁移脚本
# 该脚本初始化所有与墓地购买相关的数据库表

set -e

echo "🔧 开始初始化墓地购买系统数据库..."

# 数据库连接配置（根据实际环境修改）
DB_HOST=${DB_HOST:-localhost}
DB_USER=${DB_USER:-root}
DB_PASS=${DB_PASS:-}
DB_NAME=${DB_NAME:-solar_system}

# 建立MySQL连接并执行迁移
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOF'

-- 墓地购买配置表
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

-- 用户墓地配额表
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

-- 墓地购买交易记录表
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

-- 免费墓地分配记录表
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

-- 初始化默认配置（如果尚未存在）
INSERT IGNORE INTO grave_purchase_config 
  (free_graves_per_user, usdt_price_per_grave, currency, is_enabled)
VALUES 
  (1, 100, 'USDT', 1);

EOF

echo "✅ 墓地购买系统数据库初始化完成！"
echo ""
echo "📋 已创建以下表："
echo "  - grave_purchase_config           (购买配置表)"
echo "  - user_grave_quota                (用户配额表)"
echo "  - grave_purchase_records          (购买记录表)"
echo "  - free_grave_allocation_records   (免费分配记录表)"
echo ""
echo "⚙️  默认配置："
echo "  - 每人免费墓地数：1"
echo "  - 额外墓地价格：100 USDT"
echo ""
echo "💡 提示：可通过管理员 API 修改配置："
echo "  PUT /api/purchase/admin/config"
