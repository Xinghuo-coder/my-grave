#!/bin/bash

# 太阳系可视化登录功能安装脚本
# 作者: SoftPx
# 日期: 2026-02-25

echo "🌌 太阳系可视化 - 登录功能安装向导"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Node.js
echo -e "${BLUE}[1/5]${NC} 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未找到 Node.js，请先安装 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"
echo ""

# 检查 npm
echo -e "${BLUE}[2/5]${NC} 检查 npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 未找到 npm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm 版本: $(npm -v)${NC}"
echo ""

# 安装依赖
echo -e "${BLUE}[3/5]${NC} 安装项目依赖..."
echo -e "${YELLOW}⏳ 这可能需要几分钟...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 依赖安装成功${NC}"
else
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi
echo ""

# 创建环境配置文件
echo -e "${BLUE}[4/5]${NC} 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ 已创建 .env 文件${NC}"
else
    echo -e "${YELLOW}⚠️  .env 文件已存在，跳过${NC}"
fi
echo ""

# 创建必要的目录
echo -e "${BLUE}[5/5]${NC} 创建必要目录..."
mkdir -p server/database
echo -e "${GREEN}✅ 目录结构准备完成${NC}"
echo ""

# 完成
echo "======================================"
echo -e "${GREEN}🎉 安装完成！${NC}"
echo ""
echo "📖 下一步操作："
echo ""
echo "  1. 启动服务（推荐）："
echo -e "     ${BLUE}npm start${NC}"
echo ""
echo "  2. 或分别启动："
echo -e "     终端1: ${BLUE}npm run server:dev${NC}"
echo -e "     终端2: ${BLUE}npm run dev${NC}"
echo ""
echo "  3. 访问应用："
echo -e "     登录页: ${BLUE}http://localhost:8095/auth.html${NC}"
echo -e "     主页面: ${BLUE}http://localhost:8095/${NC}"
echo ""
echo "📚 文档："
echo "   - 快速指南: README_AUTH.md"
echo "   - 完整文档: AUTH_GUIDE.md"
echo ""
echo "⚠️  开发模式提示："
echo "   验证码会显示在浏览器控制台和服务器终端"
echo ""
echo "======================================"
