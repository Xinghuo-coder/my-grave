#!/bin/bash

# 性能优化切换脚本
# 用于快速启用优化后的路由和数据库层

set -e

echo "========================================="
echo "🚀 Solar System 性能优化切换工具"
echo "========================================="
echo ""

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 准备工作:"
echo "   1. 备份原始文件"
echo "   2. 启用优化版本"
echo "   3. 安装新依赖"
echo ""

read -p "继续? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "🔄 执行优化..."
echo ""

# 1. 备份原始文件
echo "📦 备份原始文件..."
cp server/routes/auth.js server/routes/auth_backup_$(date +%Y%m%d_%H%M%S).js 2>/dev/null || true
cp server/routes/earth.js server/routes/earth_backup_$(date +%Y%m%d_%H%M%S).js 2>/dev/null || true
echo "   ✅ 备份完成"

# 2. 替换为优化版本
echo ""
echo "🔧 启用优化版本..."

if [ -f "server/routes/auth_optimized.js" ]; then
    mv server/routes/auth_optimized.js server/routes/auth.js
    echo "   ✅ auth.js 已更新"
else
    echo "   ⚠️  auth_optimized.js 不存在,跳过"
fi

if [ -f "server/routes/earth_optimized.js" ]; then
    mv server/routes/earth_optimized.js server/routes/earth.js
    echo "   ✅ earth.js 已更新"
else
    echo "   ⚠️  earth_optimized.js 不存在,跳过"
fi

# 3. 安装新依赖
echo ""
echo "📦 安装新依赖..."
npm install morgan response-time

echo ""
echo "========================================="
echo "✅ 优化完成!"
echo "========================================="
echo ""
echo "📝 后续步骤:"
echo "   1. 运行服务器: npm run server:dev"
echo "   2. 测试功能: 访问 http://localhost:3000"
echo "   3. 查看监控: http://localhost:3000/api/metrics"
echo "   4. 健康检查: http://localhost:3000/api/health"
echo ""
echo "📖 详细文档:"
echo "   - 性能分析: PERFORMANCE_OPTIMIZATION_REPORT.md"
echo "   - 实施指南: OPTIMIZATION_IMPLEMENTATION_GUIDE.md"
echo ""
echo "⚠️  注意: 如需回滚,使用备份文件:"
echo "   server/routes/auth_backup_*.js"
echo "   server/routes/earth_backup_*.js"
echo ""
