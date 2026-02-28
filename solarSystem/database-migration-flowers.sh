#!/bin/bash

# 墓地鲜花系统数据库迁移脚本
# 创建用于鲜花赠送、评论和点赞的数据库表

set -e

echo "🌹 开始墓地鲜花系统数据库迁移..."

# 从 .env 读取数据库配置
if [ ! -f .env ]; then
  echo "❌ 未找到 .env 文件"
  exit 1
fi

# 提取数据库配置
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f 2)
DB_USER=$(grep DB_USER .env | cut -d '=' -f 2)
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f 2)
DB_NAME=$(grep DB_NAME .env | cut -d '=' -f 2)
DB_PORT=$(grep DB_PORT .env | cut -d '=' -f 2 || echo "3306")

# 如果使用的是 SQLite
if [[ "$DB_TYPE" == *"sqlite"* ]]; then
  echo "⚠️  SQLite 数据库，跳过此脚本（SQLite 在应用启动时自动创建表）"
  exit 0
fi

echo "📝 数据库配置:"
echo "  主机: $DB_HOST:$DB_PORT"
echo "  数据库: $DB_NAME"
echo "  用户: $DB_USER"

# 创建 SQL 脚本
SQL_SCRIPT=$(cat <<'EOF'

-- 鲜花配置表
CREATE TABLE IF NOT EXISTS grave_flower_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flower_type VARCHAR(50) UNIQUE NOT NULL COMMENT '鲜花类型标识（如：rose, lily）',
  flower_name VARCHAR(100) NOT NULL COMMENT '鲜花中文名称',
  flower_emoji VARCHAR(10) COMMENT '鲜花表情符号',
  usdt_price DECIMAL(10, 2) NOT NULL COMMENT '单个鲜花的 USDT 价格',
  description TEXT COMMENT '鲜花描述',
  is_available BOOLEAN DEFAULT true COMMENT '是否可用',
  daily_limit INT COMMENT '日购买限制（可选）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_available (is_available)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 用户鲜花购买记录表
CREATE TABLE IF NOT EXISTS user_flower_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '购买用户 ID',
  flower_type VARCHAR(50) NOT NULL COMMENT '鲜花类型',
  quantity INT NOT NULL DEFAULT 1 COMMENT '购买数量',
  usdt_amount DECIMAL(10, 2) NOT NULL COMMENT '支付的 USDT 金额',
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '购买时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flower_type) REFERENCES grave_flower_config(flower_type) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),
  INDEX idx_purchase_date (purchase_date)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 墓地鲜花赠送记录表
CREATE TABLE IF NOT EXISTS grave_flower_donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grave_id INT NOT NULL COMMENT '接收鲜花的墓地 ID',
  user_id INT COMMENT '赠送人用户 ID（可为空表示匿名）',
  flower_type VARCHAR(50) NOT NULL COMMENT '鲜花类型',
  quantity INT NOT NULL DEFAULT 1 COMMENT '赠送数量',
  message TEXT COMMENT '留言信息',
  donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '赠送时间',
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (flower_type) REFERENCES grave_flower_config(flower_type) ON DELETE RESTRICT,
  INDEX idx_grave_id (grave_id),
  INDEX idx_user_id (user_id),
  INDEX idx_donated_at (donated_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 墓地点赞表（免费）
CREATE TABLE IF NOT EXISTS grave_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grave_id INT NOT NULL COMMENT '被点赞的墓地 ID',
  user_id INT COMMENT '点赞人用户 ID（可为空表示匿名用户）',
  ip_address VARCHAR(45) COMMENT '匿名用户的 IP 地址',
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_like (user_id, grave_id),
  UNIQUE KEY unique_ip_like (ip_address, grave_id),
  INDEX idx_grave_id (grave_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 墓地评论表
CREATE TABLE IF NOT EXISTS grave_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grave_id INT NOT NULL COMMENT '评论所属的墓地 ID',
  user_id INT COMMENT '评论人用户 ID（可为空表示匿名）',
  comment_text TEXT NOT NULL COMMENT '评论内容',
  is_anonymous BOOLEAN DEFAULT false COMMENT '是否匿名评论',
  likes_count INT DEFAULT 0 COMMENT '评论获赞数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评论创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  FOREIGN KEY (grave_id) REFERENCES graves(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_grave_id (grave_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 评论点赞表（免费）
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  comment_id INT NOT NULL COMMENT '被点赞的评论 ID',
  user_id INT COMMENT '点赞人用户 ID（可为空表示匿名用户）',
  ip_address VARCHAR(45) COMMENT '匿名用户的 IP 地址',
  liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  FOREIGN KEY (comment_id) REFERENCES grave_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_comment_like (user_id, comment_id),
  UNIQUE KEY unique_ip_comment_like (ip_address, comment_id),
  INDEX idx_comment_id (comment_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

EOF
)

# 执行 SQL 脚本
echo ""
echo "📊 执行数据库迁移..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<< "$SQL_SCRIPT"

if [ $? -eq 0 ]; then
  echo "✅ 鲜花系统数据库迁移成功！"
  echo ""
  echo "📋 已创建的表："
  echo "  1. grave_flower_config - 鲜花配置"
  echo "  2. user_flower_purchases - 用户购买记录"
  echo "  3. grave_flower_donations - 鲜花赠送记录"
  echo "  4. grave_likes - 墓地点赞（免费）"
  echo "  5. grave_comments - 评论"
  echo "  6. comment_likes - 评论点赞（免费）"
else
  echo "❌ 数据库迁移失败"
  exit 1
fi
