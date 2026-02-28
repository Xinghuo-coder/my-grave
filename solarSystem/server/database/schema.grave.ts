/**
 * 坟墓数据库架构定义
 * 用于创建相应的数据库表
 */

// 坟墓表
export const GRAVE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS graves (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  grave_block_id INT NOT NULL,
  
  deceased_name VARCHAR(255) NOT NULL COMMENT '墓主人名字',
  deceased_birth_date DATE COMMENT '出生日期',
  deceased_death_date DATE COMMENT '去世日期',
  deceased_age INT COMMENT '年龄',
  
  epitaph TEXT NOT NULL COMMENT '墓志铭',
  life_overview LONGTEXT NOT NULL COMMENT '生平概述',
  self_evaluation LONGTEXT COMMENT '自我评价',
  others_evaluation LONGTEXT COMMENT '他人评价',
  influence_on_others LONGTEXT COMMENT '对周围的影响',
  wishes_before_death JSON COMMENT '死前愿望清单（JSON数组）',
  
  video_url VARCHAR(500) COMMENT '个人视频URL',
  video_uploaded_at TIMESTAMP COMMENT '视频上传时间',
  
  photos JSON COMMENT '图片信息（最多5张，JSON数组）',
  
  will LONGTEXT COMMENT '遗嘱内容',
  will_doc_url VARCHAR(500) COMMENT '遗嘱文档URL',
  inheritance_plan LONGTEXT COMMENT '遗产分配方案',
  inheritance_plan_url VARCHAR(500) COMMENT '遗产分配文档URL',
  
  social_accounts JSON COMMENT '社交账号（JSON数组）',

  grave_data_encrypted BOOLEAN DEFAULT true COMMENT '坟墓信息是否已按账号加密存储',
  grave_data_encryption_version VARCHAR(16) DEFAULT 'v1' COMMENT '坟墓信息加密版本（每账号独立密钥）',
  
  is_public BOOLEAN DEFAULT true COMMENT '是否公开',
  allow_comments BOOLEAN DEFAULT true COMMENT '是否允许评论',
  allow_sharing BOOLEAN DEFAULT true COMMENT '是否允许分享',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  last_viewed_at TIMESTAMP COMMENT '最后浏览时间',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grave_block_id) REFERENCES grave_blocks(id),
  UNIQUE KEY unique_user_grave (user_id),
  INDEX idx_is_public (is_public),
  INDEX idx_grave_data_encrypted (grave_data_encrypted),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='坟墓信息表';
`;

// 地块表
export const GRAVE_BLOCK_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_blocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  block_code VARCHAR(50) UNIQUE NOT NULL COMMENT '地块编号',
  latitude DECIMAL(10, 8) NOT NULL COMMENT '纬度',
  longitude DECIMAL(11, 8) NOT NULL COMMENT '经度',
  
  grave_id INT COMMENT '关联的坟墓ID',
  is_occupied BOOLEAN DEFAULT false COMMENT '是否已被占用',
  is_reserved BOOLEAN DEFAULT false COMMENT '是否为保留地块（前5%或后5%）',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE SET NULL,
  UNIQUE KEY unique_grave_id (grave_id),
  INDEX idx_is_occupied (is_occupied),
  INDEX idx_is_reserved (is_reserved),
  INDEX idx_block_code (block_code),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='地块信息表，系统保留地块编号的前5%和后5%不对用户开放';
`;

// 评论表（可选）
export const GRAVE_COMMENT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL,
  user_id INT,
  
  comment_text TEXT NOT NULL COMMENT '评论内容',
  is_anonymous BOOLEAN DEFAULT false COMMENT '是否匿名',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_grave_id (grave_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='坟墓评论表';
`;

// 浏览历史表（可选）
export const GRAVE_VIEW_HISTORY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_view_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL,
  user_id INT COMMENT '用户ID（如果是登录用户）',
  
  viewer_ip VARCHAR(45) COMMENT '访问者IP',
  viewer_user_agent VARCHAR(500) COMMENT '访问者User-Agent',
  
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_grave_id (grave_id),
  INDEX idx_user_id (user_id),
  INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='坟墓浏览历史表';
`;

// 用户扩展表（添加与坟墓相关的字段）
export const USER_GRAVE_EXTENSION_SQL = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  has_grave BOOLEAN DEFAULT false COMMENT '是否已创建坟墓';

ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  grave_id INT COMMENT '坟墓ID',
  ADD FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE SET NULL;
`;

export const ALL_MIGRATIONS = [
  GRAVE_BLOCK_TABLE_SQL,
  GRAVE_TABLE_SQL,
  GRAVE_COMMENT_TABLE_SQL,
  GRAVE_VIEW_HISTORY_TABLE_SQL,
  USER_GRAVE_EXTENSION_SQL,
];
