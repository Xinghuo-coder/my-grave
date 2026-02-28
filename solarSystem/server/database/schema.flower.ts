/**
 * 墓地鲜花系统数据库架构定义
 * 包含鲜花购买配置、赠送记录、点赞和评论功能
 */

// 鲜花类型配置表
export const GRAVE_FLOWER_CONFIG_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_flower_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  flower_type VARCHAR(50) NOT NULL UNIQUE COMMENT '鲜花类型（如 rose, lily, chrysanthemum）',
  flower_name VARCHAR(100) NOT NULL COMMENT '鲜花中文名称（如 玫瑰、百合等）',
  flower_emoji VARCHAR(10) COMMENT '鲜花表情符号',
  
  usdt_price DECIMAL(18, 6) NOT NULL COMMENT '购买价格（USDT）',
  description TEXT COMMENT '鲜花描述',
  
  is_available BOOLEAN DEFAULT true COMMENT '是否可用',
  daily_limit INT COMMENT '每日购买限制（可选）',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='墓地鲜花类型配置表';
`;

// 用户鲜花购买记录表
export const USER_FLOWER_PURCHASE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS user_flower_purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '购买用户ID',
  
  flower_type VARCHAR(50) NOT NULL COMMENT '鲜花类型',
  quantity INT NOT NULL DEFAULT 1 COMMENT '购买数量',
  usdt_amount DECIMAL(18, 6) NOT NULL COMMENT '支付的USDT金额',
  
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '购买日期',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flower_type) REFERENCES grave_flower_config(flower_type),
  INDEX idx_user_id (user_id),
  INDEX idx_purchase_date (purchase_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='用户鲜花购买记录表';
`;

// 墓地鲜花赠送记录表
export const GRAVE_FLOWER_DONATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_flower_donations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL COMMENT '墓地ID',
  user_id INT COMMENT '赠送用户ID（可为空，表示游客）',
  
  flower_type VARCHAR(50) NOT NULL COMMENT '鲜花类型',
  quantity INT NOT NULL DEFAULT 1 COMMENT '赠送数量',
  
  message TEXT COMMENT '赠花留言',
  
  donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '赠送时间',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (flower_type) REFERENCES grave_flower_config(flower_type),
  INDEX idx_grave_id (grave_id),
  INDEX idx_user_id (user_id),
  INDEX idx_donated_at (donated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='墓地鲜花赠送记录表';
`;

// 墓地点赞记录表（免费）
export const GRAVE_LIKES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL COMMENT '墓地ID',
  user_id INT COMMENT '用户ID（可为空，表示游客）',
  
  ip_address VARCHAR(45) COMMENT '访问者IP地址',
  
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_grave_like (user_id, grave_id),
  UNIQUE KEY unique_ip_grave_like (ip_address, grave_id),
  INDEX idx_grave_id (grave_id),
  INDEX idx_user_id (user_id),
  INDEX idx_liked_at (liked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='墓地点赞记录表（免费）';
`;

// 墓地评论表
export const GRAVE_COMMENTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL COMMENT '墓地ID',
  user_id INT COMMENT '评论用户ID（可为空，表示游客）',
  
  comment_text TEXT NOT NULL COMMENT '评论内容',
  is_anonymous BOOLEAN DEFAULT false COMMENT '是否匿名',
  
  likes_count INT DEFAULT 0 COMMENT '评论获赞数',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_grave_id (grave_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='墓地评论表';
`;

// 评论点赞记录表（免费）
export const COMMENT_LIKES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL COMMENT '评论ID',
  user_id INT COMMENT '用户ID（可为空，表示游客）',
  
  ip_address VARCHAR(45) COMMENT '访问者IP地址',
  
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (comment_id) REFERENCES grave_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_comment_like (user_id, comment_id),
  UNIQUE KEY unique_ip_comment_like (ip_address, comment_id),
  INDEX idx_comment_id (comment_id),
  INDEX idx_user_id (user_id),
  INDEX idx_liked_at (liked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='评论点赞记录表（免费）';
`;

export const ALL_FLOWER_MIGRATIONS = [
  GRAVE_FLOWER_CONFIG_TABLE_SQL,
  USER_FLOWER_PURCHASE_TABLE_SQL,
  GRAVE_FLOWER_DONATION_TABLE_SQL,
  GRAVE_LIKES_TABLE_SQL,
  GRAVE_COMMENTS_TABLE_SQL,
  COMMENT_LIKES_TABLE_SQL,
];
