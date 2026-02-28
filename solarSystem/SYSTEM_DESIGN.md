# MyGrave 系统设计文档

## 📋 项目概述

MyGrave 是一个基于 Three.js 和 Web3 技术的虚拟纪念墓地系统，用户可以在地球表面的虚拟地块上创建和管理数字坟墓。

---

## 🎯 系统功能需求

### 1. 用户分类

#### 1.1 游客（Guest - 免登录）
- ✅ **可访问的功能**：
  - 查看公开的坟墓信息
  - 查看地球上的所有公开坟墓地块
  - 搜索和浏览坟墓
  - 查看坟墓的公开内容

- ❌ **禁止的功能**：
  - 创建坟墓
  - 编辑任何坟墓
  - 删除任何坟墓
  - 发表评论（可选）
  - 上传文件

#### 1.2 正式用户（Registered User - 已登录）
- ✅ **可访问的功能**：
  - 所有游客可访问的功能
  - **创建一个坟墓**（每个账号最多一个）
  - 编辑自己的坟墓
  - 删除自己的坟墓
  - 上传个人视频和图片
  - 设置坟墓的公开/私密
  - 管理遗嘱和遗产分配方案
  - 查看自己坟墓的访问统计

---

### 2. 坟墓数据结构

```typescript
坟墓包含以下信息：

基础信息：
├── 墓主人名字（必填）
├── 出生日期（可选）
├── 去世日期（可选）
└── 年龄（自动计算）

文字内容：
├── 墓志铭（必填，≤200字）- 在3D地块上显示
├── 生平概述（必填，详细的人生经历）
├── 自我评价（可选，本人评价）
├── 他人评价（可选，亲友评价）
├── 对周围的影响（可选，社会影响）
└── 死前愿望清单（可选，多条）

多媒体内容：
├── 个人视频（最多1个）
└── 图片（最多5张）

法律文件：
├── 遗嘱（可选）
└── 遗产分配方案（可选）

社交媒体：
└── 社交账号链接（微信、QQ、微博、抖音等）

访问控制：
├── 是否公开（游客可见）
├── 是否允许评论
└── 是否允许分享
```

---

## 📊 数据库设计

### 表结构

#### `graves` 表 - 坟墓信息
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID（外键） |
| grave_block_id | INT | 地块ID（外键） |
| deceased_name | VARCHAR(255) | 墓主人名字 |
| epitaph | TEXT | 墓志铭 |
| life_overview | LONGTEXT | 生平概述 |
| self_evaluation | LONGTEXT | 自我评价 |
| others_evaluation | LONGTEXT | 他人评价 |
| influence_on_others | LONGTEXT | 对周围的影响 |
| wishes_before_death | JSON | 死前愿望清单 |
| video_url | VARCHAR(500) | 视频URL |
| photos | JSON | 图片信息数组 |
| will | LONGTEXT | 遗嘱 |
| inheritance_plan | LONGTEXT | 遗产分配方案 |
| social_accounts | JSON | 社交账号 |
| is_public | BOOLEAN | 是否公开 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
| view_count | INT | 浏览次数 |

#### `grave_blocks` 表 - 地块信息
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| block_code | VARCHAR(50) | 地块编号（唯一） |
| latitude | DECIMAL(10,8) | 纬度 |
| longitude | DECIMAL(11,8) | 经度 |
| grave_id | INT | 关联的坟墓ID |
| is_occupied | BOOLEAN | 是否已被占用 |
| created_at | TIMESTAMP | 创建时间 |

#### `grave_comments` 表 - 评论表（可选）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| grave_id | INT | 坟墓ID（外键） |
| user_id | INT | 用户ID（可为空，匿名） |
| comment_text | TEXT | 评论内容 |
| is_anonymous | BOOLEAN | 是否匿名 |
| created_at | TIMESTAMP | 创建时间 |

#### `grave_view_history` 表 - 浏览历史（可选）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| grave_id | INT | 坟墓ID（外键） |
| user_id | INT | 用户ID（可为空） |
| viewer_ip | VARCHAR(45) | 访问者IP |
| viewed_at | TIMESTAMP | 浏览时间 |

---

## 🔐 权限控制

### 权限矩阵

| 操作 | 游客 | 正式用户 | 备注 |
|------|------|---------|------|
| 查看公开坟墓 | ✅ | ✅ | 完整信息 |
| 查看自己的坟墓 | ❌ | ✅ | 包括私密内容 |
| 创建坟墓 | ❌ | ✅ | 每个账号最多1个 |
| 编辑坟墓 | ❌ | ✅ | 仅自己的坟墓 |
| 删除坟墓 | ❌ | ✅ | 仅自己的坟墓 |
| 上传文件 | ❌ | ✅ | 视频1个，图片5个 |
| 发表评论 | ❌ | ✅ | 可选功能 |
| 查看统计数据 | ❌ | ✅ | 仅自己的坟墓 |

---

## 📡 API 端点设计

### 坟墓相关 API

```
GET    /api/graves                 获取公开坟墓列表
GET    /api/graves/:id             获取坟墓详情
POST   /api/graves                 创建坟墓（需登录）
PUT    /api/graves/:id             更新坟墓（需是主人）
DELETE /api/graves/:id             删除坟墓（需是主人）
GET    /api/user/:userId/grave    获取用户的坟墓
POST   /api/graves/:id/view        记录浏览
GET    /api/graves/:id/completion  获取完整度
```

### 地块相关 API

```
GET    /api/blocks/:blockId                获取地块信息
GET    /api/blocks/search/byCode          按编号搜索
GET    /api/blocks/search/byLocation      按位置搜索
GET    /api/blocks/available              获取可用地块
GET    /api/blocks/:blockId/nearby        获取周围地块
```

---

## 🎮 前端集成要点

### 3D 交互

1. **地块显示**
   - 在地球表面显示已占用的地块
   - 为有坟墓的地块显示特殊标记
   - 支持点击地块查看坟墓

2. **坟墓详情展示**
   - 在 3D 视图中显示墓志铭
   - 点击后弹出详细信息面板
   - 展示视频和图片

3. **用户交互**
   - 游客：只能查看
   - 正式用户：可以创建、编辑、删除自己的坟墓
   - 编辑器：文本编辑、文件上传、社交账号管理

---

## 🔒 安全考虑

1. **身份验证**
   - 登录用户验证
   - Session 管理
   - CSRF 防护

2. **数据保护**
   - 私密坟墓只有主人可见
   - 敏感信息（遗嘱、遗产）加密存储
   - 文件上传的安全检查

3. **内容审核**
   - 坟墓内容审核（可选）
   - 评论审核（可选）
   - 不适当内容举报

---

## 📈 扩展功能（Future）

1. **社交功能**
   - 坟墓评论和点赞
   - 纪念日提醒
   - 群体纪念活动

2. **分析统计**
   - 坟墓访问统计
   - 热门坟墓排行
   - 用户行为分析

3. **高级功能**
   - AR 技术展示
   - 语音合成读取墓志铭
   - NFT 坟墓证书
   - Web3 遗产管理

---

## 🛠️ 技术栈

- **前端**: Three.js, TypeScript, Vue.js
- **后端**: Node.js, Express, TypeScript
- **数据库**: MySQL
- **存储**: 云存储（视频、图片、文档）
- **认证**: Session + JWT（可选）

---

## 📝 实现步骤

### Phase 1: 核心功能
- [ ] 用户认证系统
- [ ] 坟墓创建/编辑/删除
- [ ] 地块管理
- [ ] 基础权限控制

### Phase 2: 多媒体支持
- [ ] 文件上传（图片、视频）
- [ ] 媒体库管理
- [ ] 图片压缩和优化

### Phase 3: 社交功能
- [ ] 评论系统
- [ ] 分享功能
- [ ] 浏览统计

### Phase 4: 优化和扩展
- [ ] 性能优化
- [ ] 高级功能
- [ ] 移动端适配

---

## 📞 API 调用示例

### 创建坟墓
```bash
curl -X POST http://localhost:3000/api/graves \
  -H "Content-Type: application/json" \
  -d '{
    "deceasedName": "John Doe",
    "epitaph": "永远怀念",
    "lifeOverview": "一个普通但伟大的人生...",
    "graveBlockId": 12345,
    "isPublic": true
  }'
```

### 获取坟墓详情
```bash
curl http://localhost:3000/api/graves/1
```

### 搜索地块
```bash
curl "http://localhost:3000/api/blocks/search/byCode?code=BJ_39.9042_116.4074"
```

---

**最后更新**: 2026-02-28
