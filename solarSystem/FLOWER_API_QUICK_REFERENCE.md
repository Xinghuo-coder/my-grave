# 🌹 鲜花系统 API 快速参考

## 快速开始

### 1. 初始化鲜花系统
```bash
# 运行数据库迁移
bash database-migration-flowers.sh

# 启动应用服务器
npm run server
```

首次注册用户时，系统会自动初始化鲜花配置。

### 2. 获取可用鲜花
```bash
curl http://localhost:3000/api/flowers/config
```

### 3. 赠送鲜花（需身份认证）

**步骤1：创建订单**
```bash
curl -X POST http://localhost:3000/api/flowers/graves/123/flowers/send \
  -H "Content-Type: application/json" \
  -b "sessionid=xxx" \
  -d '{
    "flowerType": "rose",
    "quantity": 5
  }'
```

**步骤2：用户完成支付后确认**
```bash
curl -X POST http://localhost:3000/api/flowers/graves/123/flowers/confirm \
  -H "Content-Type: application/json" \
  -b "sessionid=xxx" \
  -d '{
    "orderId": 999,
    "message": "永远怀念你"
  }'
```

---

## API 端点总览

### 🌻 鲜花管理

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/flowers/config` | ❌ | 获取所有鲜花类型 |
| GET | `/api/flowers/graves/{id}/flowers` | ❌ | 获取墓地的鲜花记录 |
| POST | `/api/flowers/graves/{id}/flowers/send` | ✅ | 赠送鲜花（创建订单） |
| POST | `/api/flowers/graves/{id}/flowers/confirm` | ✅ | 确认赠送 |
| PUT | `/api/flowers/admin/config` | ✅ | 修改鲜花配置（仅管理员） |

### 👍 点赞系统

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/flowers/graves/{id}/likes` | ❌ | 获取点赞数 |
| POST | `/api/flowers/graves/{id}/like` | ❌ | 点赞墓地 |
| DELETE | `/api/flowers/graves/{id}/like` | ❌ | 取消点赞 |
| POST | `/api/comments/{id}/like` | ❌ | 点赞评论 |
| DELETE | `/api/comments/{id}/like` | ❌ | 取消点赞评论 |

### 💬 评论系统

| 方法 | 端点 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/flowers/graves/{id}/comments` | ❌ | 发表评论 |
| GET | `/api/flowers/graves/{id}/comments` | ❌ | 获取评论列表 |
| DELETE | `/api/comments/{id}` | ✅ | 删除评论 |

---

## 鲜花类型和价格

| 类型 | 中文 | 表情 | 价格 |
|------|------|------|------|
| rose | 玫瑰花 | 🌹 | 1 USDT |
| lily | 百合花 | 🌸 | 2 USDT |
| chrysanthemum | 菊花 | 🌼 | 1 USDT |
| sunflower | 向日葵 | 🌻 | 1.5 USDT |
| tulip | 郁金香 | 🌷 | 2 USDT |

---

## 响应示例

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": { /* ... */ }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误"
}
```

---

## 常见错误

| 错误 | 解决方案 |
|------|--------|
| 401 Unauthorized | 需要登录（POST到花卉端点时） |
| 400 Bad Request | 检查请求参数 |
| 404 Not Found | 墓地或评论不存在 |
| 已点赞过此墓地 | 先取消点赞再重试 |
| 无权限删除评论 | 必须是评论作者 |

---

## 集成示例代码

### JavaScript/Node.js

```javascript
// 初始化客户端
const API_BASE = 'http://localhost:3000/api';

// 获取鲜花列表
async function getFlowers() {
  const res = await fetch(`${API_BASE}/flowers/config`);
  return res.json();
}

// 点赞墓地
async function likeGrave(graveId) {
  const res = await fetch(`${API_BASE}/flowers/graves/${graveId}/like`, {
    method: 'POST',
    credentials: 'include'
  });
  return res.json();
}

// 发表评论
async function postComment(graveId, text) {
  const res = await fetch(`${API_BASE}/flowers/graves/${graveId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentText: text, isAnonymous: true })
  });
  return res.json();
}
```

### Python

```python
import requests

API_BASE = 'http://localhost:3000/api'

def get_flowers():
    response = requests.get(f'{API_BASE}/flowers/config')
    return response.json()

def like_grave(grave_id):
    response = requests.post(
        f'{API_BASE}/flowers/graves/{grave_id}/like',
        cookies={'sessionid': 'your-session-id'}
    )
    return response.json()

def post_comment(grave_id, text):
    response = requests.post(
        f'{API_BASE}/flowers/graves/{grave_id}/comments',
        json={'commentText': text, 'isAnonymous': True}
    )
    return response.json()
```

---

## 测试命令

```bash
# 运行完整测试套件
bash test-flower-system.sh

# 单个端点测试
curl http://localhost:3000/api/flowers/config

# 创建测试评论
curl -X POST http://localhost:3000/api/flowers/graves/1/comments \
  -H "Content-Type: application/json" \
  -d '{"commentText":"测试评论","isAnonymous":true}'

# 获取评论列表
curl http://localhost:3000/api/flowers/graves/1/comments?page=1&limit=10

# 点赞墓地
curl -X POST http://localhost:3000/api/flowers/graves/1/like
```

---

## 故障排查

### 数据库连接错误
```bash
# 检查数据库配置
echo $DB_HOST
echo $DB_USER
echo $DB_NAME

# 手动连接测试
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME
```

### 路由未找到
- 确保 `/server/routes/flowers.ts` 已创建
- 检查 `/server/index.ts` 中是否导入了路由

### 鲜花配置未初始化
- 首次注册新用户会自动初始化
- 或者手动调用 `GraveFlowerService.initializeFlowerConfig()`

---

## 文件清单

| 文件 | 说明 |
|------|------|
| server/services/GraveFlowerService.ts | 核心服务类（30+ 方法） |
| server/routes/flowers.ts | API 路由定义 |
| server/types/flower.ts | TypeScript 类型定义 |
| server/database/schema.flower.ts | 数据库表定义 |
| database-migration-flowers.sh | 数据库迁移脚本 |
| test-flower-system.sh | 测试脚本 |
| FLOWER_SYSTEM_GUIDE.md | 完整文档 |

---

## 支持的操作系统

- ✅ macOS
- ✅ Linux
- ✅ Windows (WSL 推荐)

---

## 获取帮助

- 📖 查看完整文档：`FLOWER_SYSTEM_GUIDE.md`
- 🧪 运行测试：`bash test-flower-system.sh`
- 🐛 检查日志：`npm run server 2>&1 | tee server.log`

---

**版本：** 1.0  
**最后更新：** 2024年  
**作者：** 系统开发团队

🌹 感谢使用鲜花系统！
