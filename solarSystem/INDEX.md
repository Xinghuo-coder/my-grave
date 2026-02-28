# 🗂️ 墓地购买系统 - 文档导航索引

欢迎使用墓地购买系统！本索引帮助你快速找到所需的文档和资源。

---

## 🚀 快速导航

### 🎯 我想...

#### 快速了解系统
👉 **[README_IMPLEMENTATION.md](README_IMPLEMENTATION.md)**
- 项目概述（1 分钟）
- 核心功能说明（5 分钟）
- 快速开始（3 分钟）

#### 部署到生产环境
👉 **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** 或 **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**
- 逐步集成指南
- 所有部署检查清单
- 故障排查

#### 查看 API 文档
👉 **[GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md)** （第 API 详细文档 章节）
- 所有 9 个 API 的详细说明
- 请求/响应示例
- 错误处理

#### 快速参考命令
👉 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**
- API 速查表
- SQL 查询示例
- Curl 命令示例

#### 修改配置（如 USDT 价格）
👉 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** （配置示例 章节）
- 免费墓地数修改
- USDT 价格修改
- 启用/禁用购买功能

#### 测试系统
👉 运行 `bash test-purchase-system.sh`
或查看 **[GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md)** （使用流程 章节）

#### 遇到问题
👉 **[GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md)** （常见问题 FAQ 章节）
或 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** （常见问题排查 章节）

---

## 📚 完整文档列表

### 系统文档

| 文档 | 大小 | 内容 | 阅读时间 |
|------|------|------|---------|
| **[GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md)** | 25 KB | 完整系统文档，包含所有 API、流程、FAQ | 30-45 分钟 |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** | 15 KB | 快速参考，包含 API 表、SQL、常见命令 | 10-15 分钟 |
| **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** | 20 KB | 逐步集成指南，包含代码示例和最佳实践 | 20-30 分钟 |
| **[README_IMPLEMENTATION.md](README_IMPLEMENTATION.md)** | 15 KB | 实现总结，包含功能说明和示例场景 | 15-20 分钟 |
| **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** | 10 KB | 部署检查清单，包含所有验证步骤 | 10 分钟 |
| **[INDEX.md](INDEX.md)** | 5 KB | 本文件，文档导航索引 | 3-5 分钟 |

---

## 📦 代码文件位置

### 核心系统文件

```
server/
├── database/
│   └── schema.payment.ts ........................ 数据库表定义
├── services/
│   ├── GravePurchaseService.ts ................. 核心业务逻辑服务 (📌 关键)
│   └── GraveService.ts ......................... 墓地服务 (已修改)
├── routes/
│   ├── purchase.ts ............................. API 路由定义 (📌 关键)
│   └── auth.js ................................ 认证路由 (已修改)
├── config/
│   └── grave-purchase.ts ....................... 配置管理
└── types/
    └── payment.ts ............................. 类型定义
```

### 脚本和工具

```
/
├── database-migration-purchase.sh .............. 数据库迁移脚本
├── test-purchase-system.sh .................... 自动化测试脚本
```

---

## 🔗 文档间的关系

```
START
  ↓
  ├─→ 想快速了解? → README_IMPLEMENTATION.md
  │   ↓
  │   ├─→ 想部署? → INTEGRATION_GUIDE.md 或 DEPLOYMENT_CHECKLIST.md
  │   │   ↓
  │   │   └─→ 遇到问题? → GRAVE_PURCHASE_SYSTEM.md (故障排查章节)
  │   │
  │   └─→ 想查看 API? → GRAVE_PURCHASE_SYSTEM.md (API 章节)
  │
  ├─→ 想查看快速参考? → QUICK_REFERENCE.md
  │   ↓
  │   ├─→ 看命令示例? → 查看 CURL/SQL 部分
  │   └─→ 看常见问题? → QUICK_REFERENCE.md (常见问题排查)
  │
  └─→ 想测试? → 运行 bash test-purchase-system.sh
      ↓
      └─→ 测试失败? → GRAVE_PURCHASE_SYSTEM.md (故障排查章节)
```

---

## 🎯 按使用角色快速导航

### 👤 **开发者**
- **快速开始**: [README_IMPLEMENTATION.md](README_IMPLEMENTATION.md)
- **API 文档**: [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → API 详细文档
- **代码示例**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 前端集成 章节
- **故障排查**: [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → 故障排查 章节

### 👨‍💼 **项目经理**
- **项目概述**: [README_IMPLEMENTATION.md](README_IMPLEMENTATION.md) → 项目概述
- **功能说明**: [README_IMPLEMENTATION.md](README_IMPLEMENTATION.md) → 核心功能说明
- **部署计划**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **配置管理**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → 配置示例

### 🔧 **运维人员**
- **部署指南**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 部署到生产环境
- **部署清单**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **监控指南**: [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → 后续维护
- **故障排查**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 故障排查

### 🧪 **测试人员**
- **功能说明**: [README_IMPLEMENTATION.md](README_IMPLEMENTATION.md) → 核心功能说明
- **测试脚本**: `bash test-purchase-system.sh`
- **API 测试**: [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → API 详细文档
- **测试清单**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) → 测试清单

### 🎨 **前端工程师**
- **API 文档**: [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → API 详细文档
- **集成代码**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 前端集成
- **快速参考**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 📋 常见问题快速链接

### 部署相关
- ❓ 如何初始化数据库? → [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 第 1 步
- ❓ 如何注册 API 路由? → [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 第 2 步
- ❓ 如何部署到生产? → [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 部署到生产环境
- ❓ 部署失败怎么办? → [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 故障排查

### 配置相关
- ❓ 如何修改免费墓地数? → [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → 配置示例
- ❓ 如何修改 USDT 价格? → [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → 配置示例
- ❓ 如何禁用购买功能? → [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → 配置示例

### API 相关
- ❓ 所有 API 有哪些? → [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → API 详细文档
- ❓ 如何调用 API? → [QUICK_REFERENCE.md](QUICK_REFERENCE.md) → API 速查表
- ❓ API 返回什么错误? → [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → 错误处理

### 功能相关
- ❓ 如何查看用户配额? → [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → API 文档 #2
- ❓ 如何创建购买订单? → [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → API 文档 #4
- ❓ 如何确认购买订单? → [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → API 文档 #7

### 问题排查
- ❓ 用户配额为空? → [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → 常见问题
- ❓ API 返回 404? → [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) → 故障排查
- ❓ 用户无法创建墓地? → [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) → 常见问题

---

## 🔍 按关键词快速查找

### 如果你想了解...

- **注册流程** → README_IMPLEMENTATION.md 或 GRAVE_PURCHASE_SYSTEM.md
- **购买流程** → GRAVE_PURCHASE_SYSTEM.md 或 QUICK_REFERENCE.md
- **API 列表** → GRAVE_PURCHASE_SYSTEM.md (API 章节)
- **数据库** → GRAVE_PURCHASE_SYSTEM.md (数据库表结构) 或 QUICK_REFERENCE.md
- **配置** → QUICK_REFERENCE.md 或 GRAVE_PURCHASE_SYSTEM.md
- **部署** → INTEGRATION_GUIDE.md 或 DEPLOYMENT_CHECKLIST.md
- **测试** → test-purchase-system.sh 或 GRAVE_PURCHASE_SYSTEM.md
- **故障排查** → INTEGRATION_GUIDE.md 或 GRAVE_PURCHASE_SYSTEM.md
- **代码示例** → INTEGRATION_GUIDE.md (前端集成章节)
- **SQL 查询** → QUICK_REFERENCE.md (SQL 查询示例)
- **常见问题** → QUICK_REFERENCE.md 或 GRAVE_PURCHASE_SYSTEM.md

---

## 📖 推荐阅读顺序

### 📍 对于新用户 (第一次接触)
1. 本文件 (INDEX.md) - 2 分钟
2. [README_IMPLEMENTATION.md](README_IMPLEMENTATION.md) - 10 分钟
3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - 10 分钟
4. 运行测试脚本 - 5 分钟
5. **总计**: 27 分钟即可快速上手

### 📍 对于开发者 (要修改或扩展)
1. [README_IMPLEMENTATION.md](README_IMPLEMENTATION.md) - 10 分钟
2. [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) - 30 分钟
3. 代码文件 - 自行查看
4. **总计**: 40 分钟

### 📍 对于部署人员 (要上线)
1. [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - 20 分钟
2. [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - 10 分钟
3. 执行部署步骤 - 30 分钟
4. **总计**: 60 分钟

---

## ✨ 文档特色

- ✅ **完整性**: 涵盖了系统的所有方面
- ✅ **清晰性**: 使用清晰的结构和示例
- ✅ **实用性**: 包含真实的代码和命令示例
- ✅ **易查性**: 多个索引和导航方式
- ✅ **针对性**: 不同角色有不同的快速导航

---

## 🚀 立即开始

### 第一次使用?
👉 打开 [README_IMPLEMENTATION.md](README_IMPLEMENTATION.md)

### 需要快速参考?
👉 打开 [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### 准备部署?
👉 打开 [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

### 想看完整文档?
👉 打开 [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md)

### 需要部署清单?
👉 打开 [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## 📞 获取帮助

1. **查看本索引** - 找到相关文档
2. **查看对应文档** - 查找答案
3. **查看故障排查章节** - 解决问题
4. **运行测试脚本** - 验证功能
5. **查看代码注释** - 理解实现

---

## 🎯 下一步

选择你的角色或任务，打开相应的文档开始！

**时间紧张?** → [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (10 分钟)
**想全面了解?** → [GRAVE_PURCHASE_SYSTEM.md](GRAVE_PURCHASE_SYSTEM.md) (30 分钟)
**准备部署?** → [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) (20 分钟)
**要检查清单?** → [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) (10 分钟)

---

**版本**: 1.0 | **更新**: 2024-01-01 | **状态**: ✅ 完成
