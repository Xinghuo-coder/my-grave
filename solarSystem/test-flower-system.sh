#!/bin/bash

# 墓地鲜花系统测试脚本
# 测试所有鲜花、评论和点赞相关的 API 端点

echo "🌹 开始测试墓地鲜花系统..."
echo ""

# 配置
API_BASE="http://localhost:3000/api"
GRAVE_ID=1  # 假设存在的墓地 ID
SLEEP_TIME=1

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
TESTS_PASSED=0
TESTS_FAILED=0

# 测试函数
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local expected_code=$4
  local description=$5

  echo -n "测试: $description ... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_BASE$endpoint")
  fi

  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)

  if [ "$http_code" = "$expected_code" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC} (期望 $expected_code, 实际 $http_code)"
    echo "  响应: $body"
    ((TESTS_FAILED++))
  fi

  sleep $SLEEP_TIME
}

echo "========================================="
echo "🌻 鲜花配置 API 测试"
echo "========================================="
test_endpoint "GET" "/flowers/config" "" "200" "获取鲜花配置"

echo ""
echo "========================================="
echo "🎁 鲜花赠送 API 测试"
echo "========================================="

# 测试获取墓地鲜花
test_endpoint "GET" "/flowers/graves/$GRAVE_ID/flowers" "" "200" "获取墓地鲜花"

# 测试发送鲜花（需要认证，这里会返回 401）
test_endpoint "POST" "/flowers/graves/$GRAVE_ID/flowers/send" \
  '{"flowerType":"rose","quantity":1}' \
  "401" "发送鲜花（未认证应返回 401）"

echo ""
echo "========================================="
echo "👍 点赞系统测试"
echo "========================================="

# 测试获取点赞数
test_endpoint "GET" "/flowers/graves/$GRAVE_ID/likes" "" "200" "获取墓地点赞数"

# 测试点赞墓地
test_endpoint "POST" "/flowers/graves/$GRAVE_ID/like" "" "200" "点赞墓地"

# 重复点赞应该返回错误
test_endpoint "POST" "/flowers/graves/$GRAVE_ID/like" "" "400" "重复点赞应返回错误"

# 测试取消点赞
test_endpoint "DELETE" "/flowers/graves/$GRAVE_ID/like" "" "200" "取消点赞"

echo ""
echo "========================================="
echo "💬 评论系统测试"
echo "========================================="

# 测试发表评论
test_endpoint "POST" "/flowers/graves/$GRAVE_ID/comments" \
  '{"commentText":"这是一条测试评论","isAnonymous":true}' \
  "200" "发表评论（匿名）"

# 测试获取评论列表
test_endpoint "GET" "/flowers/graves/$GRAVE_ID/comments?page=1&limit=10" "" "200" "获取评论列表"

# 测试空评论应返回错误
test_endpoint "POST" "/flowers/graves/$GRAVE_ID/comments" \
  '{"commentText":"","isAnonymous":false}' \
  "400" "发表空评论应返回错误"

# 测试过长评论应返回错误
long_text=$(printf 'a%.0s' {1..501})
test_endpoint "POST" "/flowers/graves/$GRAVE_ID/comments" \
  "{\"commentText\":\"$long_text\",\"isAnonymous\":false}" \
  "400" "发表超长评论应返回错误"

echo ""
echo "========================================="
echo "📊 测试汇总"
echo "========================================="
echo -e "${GREEN}✅ 通过: $TESTS_PASSED${NC}"
echo -e "${RED}❌ 失败: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}❌ 部分测试失败${NC}"
  exit 1
fi
