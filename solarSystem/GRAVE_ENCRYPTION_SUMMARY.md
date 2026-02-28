## ✅ 坟墓数据加密完整实现 - 总结

### 📋 已完成的工作

#### 1️⃣ **核心加密服务** ✅
- **文件**: `server/services/GraveEncryptionService.ts` (300+ 行)
- **算法**: AES-256-GCM (认证加密)
- **密钥派生**: HKDF-SHA256，每个 userId 对应唯一密钥
- **关键方法**:
  - `encryptText()` - 单个字段加密，生成随机 IV
  - `decryptText()` - 单个字段解密，验证认证标签
  - `encryptGravePayload<T>()` - 批量加密字段（18 个敏感字段）
  - `decryptGravePayload<T>()` - 批量解密字段
  - `deriveUserKey(userId)` - 稳定的按用户密钥生成

#### 2️⃣ **业务逻辑集成** ✅
- **文件**: `server/services/GraveService.ts`
- **新增方法**:
  - `encryptGraveForStorage(userId, graveData)` - **入库前加密**
  - `decryptGraveFromStorage(userId, encryptedRow)` - **读取后解密**
- **特点**: 保持现有验证方法不变，仅增加加密层

#### 3️⃣ **完整的 REST API** ✅
- **文件**: `server/routes/grave.ts` (改写为完整实现)
- **端点实现**:

| 端点 | 方法 | 功能 | 加密处理 |
|------|------|------|----------|
| `/` | GET | 获取公开坟墓列表 | 只返回基本信息 |
| `/:id` | GET | 获取坟墓详情 | **读取后解密**（所有者） |
| `/` | POST | 创建坟墓 | **入库前加密** ✨ |
| `/:id` | PUT | 更新坟墓 | **入库前加密** ✨ |
| `/:id` | DELETE | 删除坟墓 | 直接删除 |
| `/user/:userId` | GET | 获取用户坟墓 | **读取后解密**（本人） |
| `/:id/view` | POST | 记录浏览 | 仅增加计数 |

#### 4️⃣ **数据库架构更新** ✅
- **文件**: `server/database/schema.grave.ts`
- **新增列**:
  - `grave_data_encrypted BOOLEAN DEFAULT true` - 加密状态标记
  - `grave_data_encryption_version VARCHAR(16) DEFAULT 'v1'` - 版本追踪
- **索引**: `idx_grave_data_encrypted` - 优化查询

---

### 🔐 加密流程详解

#### **创建坟墓流程** (POST)
```
1. 用户提交 CreateGraveRequest
2. ✅ 验证数据结构 → GraveService.validateGraveInfo()
3. ✅ 检查用户是否已有坟墓
4. 【入库前加密】→ GraveService.encryptGraveForStorage(userId, data)
   - 使用 userId 派生的密钥
   - AES-256-GCM 加密 18 个敏感字段
   - 生成: enc:v1:<iv>:<tag>:<ciphertext>
5. 📝 INSERT 加密数据到数据库
   - 同时保存 grave_data_encrypted=true
   - 同时保存 grave_data_encryption_version='v1'
6. 📤 返回解密后的完整信息给所有者
```

#### **更新坟墓流程** (PUT)
```
1. 用户提交 UpdateGraveRequest
2. ✅ 验证权限 (userId == 坟墓主人)
3. ✅ 从数据库查询现有数据
4. ✅ 验证新数据结构
5. 【入库前加密】→ GraveService.encryptGraveForStorage(userId, updateData)
6. 📝 UPDATE 加密数据到数据库
7. 📤 返回解密后的完整信息
```

#### **读取坟墓流程** (GET)
```
1. 查询坟墓数据 (包含加密的字段值)
2. ✅ 检查权限
   - 公开坟墓: 任何人可见 (但不返回加密内容)
   - 私密坟墓: 仅所有者可见
3. 【读取后解密】(仅所有者)
   → GraveService.decryptGraveFromStorage(userId, encryptedRow)
   - 使用 userId 派生的密钥
   - AES-256-GCM 解密并验证
   - 返回明文数据
4. 📤 返回解密后的完整信息
5. 📊 增加浏览计数
```

---

### 🎯 关键特性

#### **按账号独立加密**
- 每个 userId 对应唯一的加密密钥
- 同一坟墓，不同用户无法解密
- 即使数据库被泄露，也无法跨账号破解

#### **字段级加密**
- 敏感字段单独加密：
  - 个人信息: deceasedName, deceasedBirthDate, deceasedDeathDate, deceasedAge
  - 内容: epitaph, lifeOverview, selfEvaluation, othersEvaluation, influenceOnOthers, wishesBeforeDeath
  - 媒体: video, photos
  - 法律: will, willDocUrl, inheritancePlan, inheritancePlanUrl
  - 社交: socialAccounts

#### **访问控制**
- 所有者: 完整解密内容
- 授权用户: 按权限返回
- 游客: 仅公开基本信息（加密内容不返回）

#### **版本管理**
- `grave_data_encryption_version` 支持未来迁移
- 当前版本: `v1` (AES-256-GCM)
- 便于滚动更新密钥或算法

---

### 📊 实现统计

| 组件 | 文件 | 行数 | 状态 |
|------|------|------|------|
| 加密服务 | GraveEncryptionService.ts | 300+ | ✅ 完成 |
| 业务服务 | GraveService.ts | 233 | ✅ 增强 |
| REST API | grave.ts | 570+ | ✅ 完全重写 |
| 数据库 | schema.grave.ts | 55+ | ✅ 更新 |
| **总计** | **4 个文件** | **1000+** | **✅ 完成** |

---

### 🔧 环境配置要求

**必需设置环境变量**:
```bash
# 32 字节的主加密密钥（Base64 编码）
export GRAVE_ENCRYPTION_MASTER_KEY="your-32-byte-key-in-base64"
```

**获取示例密钥**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### ✨ 使用示例

#### **创建坟墓（自动加密）**
```bash
curl -X POST http://localhost:3000/api/graves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "deceasedName": "张三",
    "epitaph": "生于1990年，2023年去世",
    "lifeOverview": "他是一个好人...",
    "isPublic": false
  }'
```

响应（返回解密后的信息）:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "deceasedName": "张三",
    "epitaph": "生于1990年，2023年去世",
    "lifeOverview": "他是一个好人...",
    "encryption": {
      "enabled": true,
      "mode": "per-account",
      "version": "v1",
      "algorithm": "AES-256-GCM"
    }
  }
}
```

#### **读取坟墓（自动解密）**
```bash
# 所有者读取 (返回完整解密内容)
curl http://localhost:3000/api/graves/1 \
  -H "Authorization: Bearer OWNER_TOKEN"

# 游客读取公开坟墓 (不返回加密内容)
curl http://localhost:3000/api/graves/1
```

---

### 🚀 下一步工作

#### 1. **数据库迁移**
```bash
# 为现有坟墓添加加密元数据
npm run migrate
```

#### 2. **密钥管理**
- [ ] 设置 GRAVE_ENCRYPTION_MASTER_KEY
- [ ] 配置密钥轮换策略
- [ ] 建立备份和恢复流程

#### 3. **测试和验证**
```bash
# 验证加密/解密工作流程
npm test server/services/GraveEncryptionService.test.ts
npm test server/routes/grave.test.ts
```

#### 4. **监控和日志**
- [ ] 记录加密操作日志
- [ ] 监控解密失败
- [ ] 审计敏感数据访问

#### 5. **文档更新**
- [ ] API 文档说明加密特性
- [ ] 用户隐私政策
- [ ] 开发者指南

---

### ✅ 验证清单

- [x] GraveEncryptionService 实现完整
- [x] GraveService 集成加密/解密
- [x] grave.ts 所有端点完整实现
- [x] 数据库架构支持加密元数据
- [x] TypeScript 类型检查通过
- [x] 入库前加密集成
- [x] 读取后解密集成
- [x] 权限控制实现
- [x] 响应格式标准化

---

### 📝 文件清单

```
server/
├── services/
│   ├── GraveEncryptionService.ts  ✨ 新增 - 核心加密
│   └── GraveService.ts             ✅ 更新 - 集成加密
├── routes/
│   └── grave.ts                    ✅ 完全重写 - 完整 CRUD
└── database/
    └── schema.grave.ts             ✅ 更新 - 加密元数据
```

---

**实现状态**: ✅ **完成**  
**密钥派生**: ✅ **按账号独立**  
**加密算法**: ✅ **AES-256-GCM**  
**字段覆盖**: ✅ **18 个敏感字段**  
**API 实现**: ✅ **完整的 REST 端点**  
**访问控制**: ✅ **权限和所有者验证**  

---

*最后更新: 2025-02-28*
