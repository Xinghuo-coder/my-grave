#!/bin/bash

# 墓地购买系统测试脚本
# 用于验证购买系统的所有功能

set -e

BASE_URL="http://localhost:3000/api"
ADMIN_TOKEN="your_admin_token_here"
USER_TOKEN="your_user_token_here"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 墓地购买系统测试${NC}\n"

# 测试 1: 获取购买配置
echo -e "${YELLOW}测试 1: 获取购买配置${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/purchase/config")
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ 通过${NC}"
  echo "配置详情:"
  echo "$RESPONSE" | jq .
else
  echo -e "${RED}✗ 失败${NC}"
  echo "$RESPONSE"
fi
echo ""

# 测试 2: 获取用户配额（需要用户 token）
echo -e "${YELLOW}测试 2: 获取用户配额${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/purchase/user/quota" \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ 通过${NC}"
  echo "用户配额:"
  echo "$RESPONSE" | jq .
else
  echo -e "${RED}✗ 失败${NC}"
  echo "错误: $RESPONSE"
  echo "提示: 请确保已登录并设置 USER_TOKEN"
fi
echo ""

# 测试 3: 计算购买价格
echo -e "${YELLOW}测试 3: 计算购买价格 (2 个墓地)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/purchase/calculate" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}')
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ 通过${NC}"
  echo "价格信息:"
  echo "$RESPONSE" | jq .
else
  echo -e "${RED}✗ 失败${NC}"
  echo "$RESPONSE"
fi
echo ""

# 测试 4: 创建购买订单（需要用户 token）
echo -e "${YELLOW}测试 4: 创建购买订单${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/purchase/create-order" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 1,
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc255e4512c67f",
    "blockchainNetwork": "Ethereum"
  }')
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ 通过${NC}"
  ORDER_ID=$(echo "$RESPONSE" | jq -r '.data.orderId')
  echo "创建的订单 ID: $ORDER_ID"
  echo "完整响应:"
  echo "$RESPONSE" | jq .
else
  echo -e "${RED}✗ 失败${NC}"
  echo "$RESPONSE"
fi
echo ""

# 测试 5: 查询订单（需要用户 token）
if [ ! -z "$ORDER_ID" ]; then
  echo -e "${YELLOW}测试 5: 查询订单 $ORDER_ID${NC}"
  RESPONSE=$(curl -s -X GET "$BASE_URL/purchase/order/$ORDER_ID" \
    -H "Authorization: Bearer $USER_TOKEN")
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "订单详情:"
    echo "$RESPONSE" | jq .
  else
    echo -e "${RED}✗ 失败${NC}"
    echo "$RESPONSE"
  fi
  echo ""
fi

# 测试 6: 获取购买历史（需要用户 token）
echo -e "${YELLOW}测试 6: 获取购买历史${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/purchase/history?limit=10" \
  -H "Authorization: Bearer $USER_TOKEN")
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ 通过${NC}"
  echo "购买历史:"
  echo "$RESPONSE" | jq .
else
  echo -e "${RED}✗ 失败${NC}"
  echo "$RESPONSE"
fi
echo ""

# 测试 7: 获取管理员配置（需要管理员 token）
echo -e "${YELLOW}测试 7: 获取管理员配置${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/purchase/admin/config" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ 通过${NC}"
  echo "管理员配置:"
  echo "$RESPONSE" | jq .
else
  echo -e "${RED}✗ 失败${NC}"
  echo "错误: $RESPONSE"
  echo "提示: 请确保已登录为管理员并设置 ADMIN_TOKEN"
fi
echo ""

# 测试 8: 修改管理员配置（需要管理员 token）
echo -e "${YELLOW}测试 8: 修改购买配置${NC}"
RESPONSE=$(curl -s -X PUT "$BASE_URL/purchase/admin/config" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "freeGravesPerUser": 2,
    "usdtPricePerGrave": 150,
    "isEnabled": true
  }')
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ 通过${NC}"
  echo "更新后的配置:"
  echo "$RESPONSE" | jq .
else
  echo -e "${RED}✗ 失败${NC}"
  echo "$RESPONSE"
fi
echo ""

# 测试 9: 确认订单（需要管理员 token）
if [ ! -z "$ORDER_ID" ]; then
  echo -e "${YELLOW}测试 9: 确认订单 $ORDER_ID${NC}"
  RESPONSE=$(curl -s -X POST "$BASE_URL/purchase/confirm-order" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"orderId\": $ORDER_ID,
      \"transactionHash\": \"0x1234567890abcdef\"
    }")
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "确认结果:"
    echo "$RESPONSE" | jq .
  else
    echo -e "${RED}✗ 失败${NC}"
    echo "$RESPONSE"
  fi
  echo ""
fi

# 总结
echo -e "${BLUE}✅ 测试完成${NC}"
echo ""
echo -e "${YELLOW}⚠️  注意:${NC}"
echo "- 某些测试需要有效的用户 token (设置 USER_TOKEN 变量)"
echo "- 某些测试需要有效的管理员 token (设置 ADMIN_TOKEN 变量)"
echo "- 确保应用已启动并监听在 http://localhost:3000"
echo ""
echo -e "${BLUE}使用方法:${NC}"
echo "1. 注册一个测试用户，获取其 token"
echo "2. 获取管理员 token"
echo "3. 修改脚本中的 USER_TOKEN 和 ADMIN_TOKEN"
echo "4. 运行脚本: bash test-purchase-system.sh"
