/**
 * 隐私权限相关的数据库表定义
 */

// 隐私配置表
export const GRAVE_PRIVACY_CONFIG_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS grave_privacy_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  
  allow_requests_for_private BOOLEAN DEFAULT true COMMENT '是否允许申请私密信息',
  require_approval_for_each_request BOOLEAN DEFAULT true COMMENT '每次申请都需要审批',
  default_expiration_days INT DEFAULT 30 COMMENT '权限默认过期天数',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='坟墓隐私配置表';
`;

// 字段隐私配置表
export const FIELD_PRIVACY_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS field_privacies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL,
  field_name VARCHAR(100) NOT NULL COMMENT '字段名称（epitaph, lifeOverview 等）',
  
  privacy_level ENUM('public', 'private', 'selective') DEFAULT 'public' COMMENT '隐私级别',
  allowed_user_ids JSON COMMENT '允许访问的用户 ID 列表（选择性公开）',
  
  expires_at TIMESTAMP NULL COMMENT '隐私设置过期时间',
  auto_public_at TIMESTAMP NULL COMMENT '自动改为公开的时间',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  UNIQUE KEY unique_field (grave_id, field_name),
  INDEX idx_privacy_level (privacy_level),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='字段级别隐私配置表';
`;

// 权限申请表
export const PERMISSION_REQUEST_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS permission_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL,
  grave_owner_id INT NOT NULL,
  requester_id INT NOT NULL,
  requester_name VARCHAR(255) COMMENT '申请者名字',
  
  field_name VARCHAR(100) NOT NULL COMMENT '申请查看的字段',
  reason TEXT COMMENT '申请原因',
  
  status ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending' COMMENT '申请状态',
  responded_at TIMESTAMP NULL COMMENT '回复时间',
  responded_by INT COMMENT '回复人 ID',
  rejection_reason TEXT COMMENT '拒绝原因',
  
  granted_until TIMESTAMP NULL COMMENT '授权有效期至',
  access_count_limit INT COMMENT '访问次数限制',
  accessed_count INT DEFAULT 0 COMMENT '已访问次数',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (grave_owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_grave_id (grave_id),
  INDEX idx_requester_id (requester_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='权限申请表';
`;

// 已授权权限表
export const GRANTED_PERMISSION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS granted_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL,
  grave_owner_id INT NOT NULL,
  user_id INT NOT NULL COMMENT '被授权的用户',
  
  fields JSON NOT NULL COMMENT '被授权访问的字段列表（JSON 数组）',
  
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by INT NOT NULL COMMENT '谁授予的权限',
  expires_at TIMESTAMP NULL COMMENT '权限过期时间',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (grave_owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_permission (grave_id, user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='已授权权限表';
`;

// 访问日志表
export const ACCESS_LOG_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS access_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_id INT NOT NULL,
  user_id INT NOT NULL,
  grave_id INT NOT NULL,
  field_name VARCHAR(100) NOT NULL COMMENT '访问的字段',
  
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) COMMENT '访问者 IP',
  user_agent TEXT COMMENT '用户代理',
  
  FOREIGN KEY (permission_id) REFERENCES granted_permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_grave_id (grave_id),
  INDEX idx_accessed_at (accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='访问日志表';
`;

// 黑名单表
export const PRIVACY_BLACKLIST_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS privacy_blacklists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL,
  grave_owner_id INT NOT NULL,
  blocked_user_id INT NOT NULL COMMENT '被加入黑名单的用户',
  
  reason TEXT COMMENT '加入原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (grave_owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_blocked (grave_id, blocked_user_id),
  INDEX idx_blocked_user_id (blocked_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='隐私黑名单表';
`;

// 白名单表（信任用户）
export const PRIVACY_WHITELIST_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS privacy_whitelists (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grave_id INT NOT NULL,
  grave_owner_id INT NOT NULL,
  trusted_user_id INT NOT NULL COMMENT '信任用户',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (grave_owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (trusted_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_trusted (grave_id, trusted_user_id),
  INDEX idx_trusted_user_id (trusted_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='隐私白名单表（自动批准的信任用户）';
`;

// 导出所有 SQL
export const PRIVACY_TABLES_SQL = [
  GRAVE_PRIVACY_CONFIG_TABLE_SQL,
  FIELD_PRIVACY_TABLE_SQL,
  PERMISSION_REQUEST_TABLE_SQL,
  GRANTED_PERMISSION_TABLE_SQL,
  ACCESS_LOG_TABLE_SQL,
  PRIVACY_BLACKLIST_TABLE_SQL,
  PRIVACY_WHITELIST_TABLE_SQL
];
