# 🌌 Three.js 太阳系可视化项目

一个基于 Three.js 的交互式 3D 太阳系模拟项目，展示了太阳系八大行星的运动轨迹和视觉效果，集成完整的用户认证系统。

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Three.js](https://img.shields.io/badge/three.js-0.170.0-brightgreen.svg)
![Webpack](https://img.shields.io/badge/webpack-5.x-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

---

## 📑 目录

- [特性](#-特性)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [用户登录系统](#-用户登录系统)
- [项目结构](#-项目结构)
- [操作指南](#-操作指南)
- [开发指南](#-开发指南)
- [API文档](#-api文档)
- [部署指南](#-部署指南)
- [故障排查](#-故障排查)
- [贡献指南](#-贡献指南)
- [变更日志](#-变更日志)

---

## ✨ 特性

### 3D可视化功能
- 🌟 **真实太阳效果**：使用自定义 GLSL Shader 实现动态太阳表面
- 🪐 **八大行星**：完整的太阳系行星模拟（水星到海王星）
- 🌀 **行星运动**：真实的公转和自转动画
- 🎯 **交互控制**：支持鼠标拖拽旋转、缩放视角
- 🚀 **相机飞行**：双击星球可平滑飞向目标
- 🌌 **天空盒**：使用银河系全景贴图
- 💫 **大气光晕**：太阳外围动态光晕效果

### 用户认证功能
- 🔐 **用户注册**：邮箱验证（手机号作为可选安全信息）
- 👤 **用户登录**：安全的Session管理
- 🔑 **密码找回**：安全问题 + 邮箱验证码双重验证
- 🛡️ **访问控制**：未登录用户自动跳转
- 📊 **用户管理**：完整的用户状态管理
- 💰 **成本优化**：关闭手机号短信验证，降低运营成本

### 地球热点系统
- 🌍 **热点网格**：地球表面划分为约1.27亿个4平方米区域
- 🎯 **点击交互**：点击地球任意位置查看热点坐标信息
- 🔍 **编号搜索**：通过地块编号快速定位到指定区域
- 📍 **平滑导航**：相机自动飞行到目标地块并显示详情
- 💾 **数据持久化**：保存用户收藏的热点区域
- 📊 **统计功能**：查看用户的热点收藏数量和分布

## 📦 技术栈

### 前端技术
- **渲染引擎**: Three.js 0.170.0
- **动画库**: @tweenjs/tween.js
- **构建工具**: Webpack 5
- **着色器**: GLSL (WebGL Shaders)
- **UI框架**: 原生JavaScript + Vue.js 2.x

### 后端技术
- **运行环境**: Node.js (>=14.0.0)
- **Web框架**: Express.js
- **数据库**: SQLite3
- **认证**: express-session + bcrypt
- **安全**: CORS、密码加密、验证码系统

## 🚀 快速开始

### 方式一：一键安装（推荐）

```bash
# 1. 进入项目目录
cd solarSystem/solarSystem

# 2. 运行安装脚本
chmod +x install.sh
./install.sh

# 3. 启动服务
npm start
```

### 方式二：手动安装

```bash
# 1. 进入项目目录
cd solarSystem/solarSystem

# 2. 安装依赖
npm install

# 3. 创建环境配置
cp .env.example .env

# 4. 启动服务（同时启动前后端）
npm start
```

### 访问应用

- 🔐 **登录页面**: http://localhost:8095/auth.html
- 🌌 **主页面**: http://localhost:8095/
- 🔌 **API服务**: http://localhost:3000/api

### 仅开发3D可视化（无需登录）

如果只想开发3D可视化部分，可以只启动前端：

```bash
npm run dev
```

---

## 🔐 用户登录系统

### 功能概述

项目集成了完整的用户认证系统，包含注册、登录、密码找回等功能。

### 注册新用户

1. 访问 http://localhost:8095/auth.html
2. 点击"立即注册"
3. 填写用户信息：
   - 用户名（必填）
   - 邮箱（必填） + 获取验证码
   - 手机号（选填，用于账号找回）
   - 密码（至少6位）
   - 安全问题及答案
4. 提交注册

**💡 开发模式提示**：验证码会显示在浏览器控制台（F12）和服务器终端

**💰 成本优化说明**：为降低运营成本，手机号短信验证已关闭，手机号作为可选的安全信息用于账号找回。

### 登录

1. 输入用户名和密码
2. 点击"登录"按钮
3. 登录成功后自动跳转到太阳系可视化主页

### 忘记密码

1. 点击"忘记密码？"
2. **步骤1**：输入用户名
3. **步骤2**：回答安全问题
4. **步骤3**：
   - 通过邮箱接收验证码
   - 输入验证码
   - 设置新密码

**💰 成本优化**：密码找回仅支持邮箱验证方式

### API接口

| 方法 | 路径 | 功能 | 说明 |
|------|------|------|------|
| POST | `/api/auth/send-code` | 发送验证码 | 仅支持邮箱验证码 |
| POST | `/api/auth/register` | 用户注册 | 手机号可选 |
| POST | `/api/auth/login` | 用户登录 | - |
| POST | `/api/auth/logout` | 退出登录 | - |
| GET  | `/api/auth/check` | 检查登录状态 | - |
| POST | `/api/auth/get-security-question` | 获取安全问题 | - |
| POST | `/api/auth/verify-security-answer` | 验证安全答案 | - |
| POST | `/api/auth/reset-password` | 重置密码 | 仅支持邮箱验证 |

详细API文档请参考后续章节。

---

## 📂 项目结构

```
solarSystem/
├── src/                          # 前端源码
│   ├── auth.html                 # 登录页面
│   ├── css/
│   │   └── auth.css              # 登录样式
│   └── js/
│       ├── index.js              # 主入口文件
│       ├── Main.js               # 主应用类
│       ├── Scene.js              # 场景管理类
│       ├── auth.js               # 登录逻辑
│       └── config/
│           └── planetsConfig.js  # 行星配置
├── server/                       # 后端服务器
│   ├── index.js                  # 服务器入口
│   ├── database/
│   │   └── db.js                 # 数据库连接
│   ├── models/
│   │   ├── User.js               # 用户模型
│   │   └── VerificationCode.js   # 验证码模型
│   ├── routes/
│   │   └── auth.js               # 认证路由
│   ├── services/
│   │   └── verificationService.js # 验证码服务
│   └── middleware/
│       └── auth.js               # 认证中间件
├── dist/                         # 构建输出
│   ├── index.html                # 主页面
│   ├── Resources/
│   │   └── 贴图/                 # 纹理资源
│   └── style/                    # 样式文件
├── config/                       # 构建配置
│   ├── webpack.dev.js            # 开发环境
│   └── webpack.prod.js           # 生产环境
├── .env.example                  # 环境配置示例
├── install.sh                    # 安装脚本
├── test-auth.js                  # 功能测试
└── package.json                  # 项目配置
```

---

## 🎮 操作指南

### 鼠标控制
- **左键拖拽**：旋转视角
- **滚轮**：缩放视野
- **右键拖拽**：平移视角
- **双击星球**：相机飞向该星球

### 地球交互
- **双击地球**：触发特殊交互效果
- **点击地表**：显示热点区域信息（坐标、编号、范围）
- **查看详情**：显示地球相关信息

### 地块搜索功能
- **搜索框位置**：页面左上角
- **使用方法**：
  1. 在搜索框输入地块编号（0 - 127,000,000）
  2. 点击"定位"按钮或按Enter键
  3. 相机自动飞行到目标地块
  4. 显示地块详细信息
- **编号规则**：从北极点0度经度开始，编号从0递增
- **快速导航**：支持快速定位到地球任意4平方米区域

### 用户操作
- **右上角用户信息**：显示当前登录用户
- **退出登录**：点击按钮退出

---

## 🪐 行星配置

项目使用配置文件管理行星参数，位于 `src/js/config/planetsConfig.js`：

```javascript
{
  name: '地球',
  orbitRadius: 60,      // 轨道半径
  size: 2.5,            // 相对大小
  texture: '...',       // 纹理路径
  orbitSpeed: 1.0,      // 公转速度
  rotationSpeed: 0.001, // 自转速度
  color: 0x4169E1,      // 主色调
  segments: 4096        // 轨道平滑度
}
```

### 支持的行星

| 行星 | 轨道半径 | 相对大小 | 特点 |
|------|----------|----------|------|
| 水星 | 30 | 1.0 | 最小，最快 |
| 金星 | 45 | 2.0 | 金色表面 |
| 地球 | 60 | 2.5 | 蓝色海洋 |
| 火星 | 80 | 3.0 | 红色表面 |
| 木星 | 100 | 6.0 | 最大气态巨行星 |
| 土星 | 120 | 6.2 | 带有光环（待实现） |
| 天王星 | 140 | 3.5 | 青色冰巨星 |
| 海王星 | 160 | 3.5 | 深蓝色 |

---

## 💻 开发指南

### NPM脚本

| 命令 | 功能 | 说明 |
|------|------|------|
| `npm start` | 启动完整应用 | 同时启动前后端（推荐） |
| `npm run dev` | 启动前端开发服务器 | 仅3D可视化，端口8095 |
| `npm run server` | 启动后端服务器 | API服务，端口3000 |
| `npm run server:dev` | 启动后端（热重载） | 开发时使用 |
| `npm run build` | 生产构建 | 构建到dist目录 |
| `npm test` | 运行测试 | 测试认证功能 |
| `npm run clean` | 清理构建文件 | 删除旧的构建产物 |

### 环境配置

创建 `.env` 文件（从 `.env.example` 复制）：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 会话密钥
SESSION_SECRET=solar-system-secret-key-2026

# 前端URL
FRONTEND_URL=http://localhost:8095
```

### 开发工作流

```bash
# 1. 安装依赖
npm install

# 2. 启动完整应用（推荐）
npm start

# 3. 或分别启动
# 终端1：后端
npm run server:dev

# 终端2：前端
npm run dev
```

### 调试技巧

#### 前端调试
1. 打开浏览器开发者工具（F12）
2. Console标签查看日志
3. Network标签检查API请求
4. Sources标签设置断点

#### 后端调试
1. 查看终端输出
2. 验证码会在终端显示
3. 使用 `console.log` 输出调试信息

### 代码规范

```bash
# 格式化代码
npm run format

# 检查格式
npm run format:check
```

---

## 🔌 API文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: Session Cookie（credentials: 'include'）

### 认证接口

#### 1. 发送验证码

```http
POST /api/auth/send-code
```

**请求体**:
```json
{
  "type": "email",           // 固定为 "email"
  "target": "user@email.com",
  "purpose": "register"      // "register" 或 "reset_password"
}
```

**响应**:
```json
{
  "success": true,
  "message": "验证码已发送",
  "code": "123456"  // 仅开发环境
}
```

**注意**：为降低运营成本，目前仅支持邮箱验证码，手机号短信验证已关闭。

#### 2. 用户注册

```http
POST /api/auth/register
```

**请求体**:
```json
{
  "username": "testuser",
  "email": "user@email.com",
  "phone": "13800138000",    // 可选，用于账号找回
  "password": "password123",
  "emailCode": "123456",
  "securityQuestion": "您的出生地是？",
  "securityAnswer": "北京"
}
```

**注意**：手机号为可选字段，作为安全信息用于账号找回，不需要验证码。

#### 3. 用户登录

```http
POST /api/auth/login
```

**请求体**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```

#### 4. 检查登录状态

```http
GET /api/auth/check
```

#### 5. 退出登录

```http
POST /api/auth/logout
```

#### 6. 获取安全问题

```http
POST /api/auth/get-security-question
```

**请求体**:
```json
{
  "username": "testuser"
}
```

#### 7. 验证安全答案

```http
POST /api/auth/verify-security-answer
```

**请求体**:
```json
{
  "username": "testuser",
  "answer": "北京"
}
```

#### 8. 重置密码

```http
POST /api/auth/reset-password
```

**请求体**:
```json
{
  "username": "testuser",
  "newPassword": "newpass123",
  "verificationCode": "123456",
  "verificationType": "email"  // 固定为 "email"
}
```

**注意**：密码找回仅支持邮箱验证方式。

---

## 🚀 部署指南

### 开发环境

当前配置适用于开发环境：
- ✅ 验证码显示在控制台
- ✅ SQLite本地数据库
- ✅ HTTP协议
- ✅ 详细错误信息

### 生产环境配置

#### 1. 配置真实邮件服务

安装依赖：
```bash
npm install nodemailer
```

修改 `server/services/verificationService.js`：
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// 在 sendEmailCode 中使用
await transporter.sendMail({
  from: process.env.SMTP_USER,
  to: email,
  subject: '验证码',
  text: `您的验证码是: ${code}，10分钟内有效。`
});
```

#### 2. 配置短信服务

推荐使用：
- Twilio
- 阿里云短信
- 腾讯云短信

#### 3. 更新环境变量

```env
NODE_ENV=production
SESSION_SECRET=随机生成的长字符串
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### 4. 启用HTTPS

```javascript
// server/index.js
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: { 
    secure: true,      // 启用HTTPS
    httpOnly: true,
    sameSite: 'strict'
  }
}));
```

#### 5. 数据库迁移（可选）

考虑从SQLite迁移到：
- PostgreSQL（推荐）
- MySQL
- MongoDB

---

## 🐛 故障排查

### 常见问题

#### Q1: 验证码收不到？

**A**: 开发环境下，验证码会显示在：
1. 浏览器控制台（F12 → Console）
2. 后端服务器终端

#### Q2: 手机号验证码收不到？

**A**: 为降低运营成本，手机号短信验证已关闭。
- 注册时手机号为可选字段
- 手机号作为安全信息，用于账号找回
- 目前仅支持邮箱验证码
- 如需开通手机号验证，请配置短信服务（见部署指南）

#### Q3: CORS错误？

**A**: 确保：
- 前端地址：http://localhost:8095
- 后端地址：http://localhost:3000
- 请求时添加 `credentials: 'include'`

#### Q4: Session丢失？

**A**: 检查：
- Cookie是否被浏览器阻止
- 确保使用 `credentials: 'include'`
- 清除浏览器Cookie重试

#### Q5: 端口被占用？

**A**: 修改端口：
```bash
# 修改后端端口
PORT=3001 npm run server

# 修改前端端口（编辑 config/webpack.dev.js）
```

#### Q6: 数据库错误？

**A**: 删除数据库文件重建：
```bash
rm server/database/users.db
# 重启服务器，数据库会自动重建
```

#### Q6: Three.js类型错误？

**A**: 确保：
- 使用 `THREE.` 前缀访问类
- 更新到最新API（详见版本兼容性）
- 检查导入语句

### 查看日志

```bash
# 前端日志
浏览器 F12 → Console

# 后端日志
服务器终端输出

# 数据库检查
sqlite3 server/database/users.db
SELECT * FROM users;
```

---

## 🤝 贡献指南

### 代码贡献流程

1. **Fork 项目**
   ```bash
   git clone <your-fork-url>
   cd solarSystem/solarSystem
   ```

2. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **开发和测试**
   ```bash
   npm install
   npm start
   npm test
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

5. **推送和PR**
   ```bash
   git push origin feature/your-feature-name
   # 然后在GitHub创建Pull Request
   ```

### 提交信息规范

使用语义化提交信息：

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```bash
feat: 添加土星光环效果
fix: 修复地球纹理加载问题
docs: 更新API文档
```

### 代码规范

- 使用ES6+语法
- 遵循Prettier格式化规则
- 添加必要的注释
- 保持函数简洁（<50行）
- 避免全局变量

---

## 📜 变更日志

### v2.0.0 (2026-02-25)

#### 新增功能
- ✨ 完整的用户认证系统
- ✨ 邮箱和手机号双重验证
- ✨ 密码找回功能
- ✨ Session会话管理
- ✨ 后端API服务器

#### 优化改进
- 🔧 更新到Three.js 0.170.0
- 🔧 修复所有deprecated API
- 🔧 优化代码结构
- 🔧 完善文档体系

#### 技术栈更新
- 添加Express.js后端
- 添加SQLite数据库
- 添加bcrypt密码加密
- 添加验证码系统

### v1.0.0 (之前)

#### 初始功能
- ✨ 太阳系3D可视化
- ✨ 八大行星模拟
- ✨ 交互控制
- ✨ 相机飞行动画
- ✨ 自定义Shader效果

---

## 📊 项目统计

- **总文件数**: 25+
- **代码行数**: 3000+
- **依赖包**: 15个
- **支持浏览器**: Chrome, Firefox, Safari, Edge
- **Node.js版本**: >=14.0.0

---

## 🔒 安全特性

### 成本优化策略

为降低运营成本，项目采取以下优化措施：

1. **关闭手机号短信验证**
   - ❌ 注册时不再需要手机号验证码
   - ❌ 密码找回不再支持手机号验证
   - ✅ 手机号改为可选字段，作为安全信息
   - ✅ 手机号可用于账号找回时的身份确认

2. **仅保留邮箱验证**
   - ✅ 注册时必须通过邮箱验证码
   - ✅ 密码找回通过邮箱验证码
   - ✅ 邮箱发送免费（开发环境控制台显示）
   - ✅ 生产环境可使用免费邮件服务（如Gmail、SendGrid免费额度）

3. **安全信息设计**
   ```
   注册信息：
   - 用户名 ✅（必填）
   - 邮箱 + 验证码 ✅（必填）
   - 手机号 ✅（选填，用于找回）
   - 密码 ✅（必填）
   - 安全问题 ✅（必填）
   
   找回密码流程：
   步骤1: 输入用户名
   步骤2: 回答安全问题
   步骤3: 邮箱验证码 + 新密码
   ```

### 已实现安全措施

1. **密码安全**
   - ✅ bcrypt加密（成本因子10）
   - ✅ 最小长度要求（6位）
   - ✅ 不返回密码哈希

2. **验证码安全**
   - ✅ 6位随机数字
   - ✅ 10分钟自动过期
   - ✅ 一次性使用
   - ✅ 与目标绑定

3. **Session安全**
   - ✅ 随机Session ID
   - ✅ 24小时有效期
   - ✅ HttpOnly Cookie

4. **数据安全**
   - ✅ SQL注入防护
   - ✅ CORS限制
   - ✅ 敏感信息隐藏

---

## 🎯 待办事项

### 短期计划
- [ ] 添加土星光环效果
- [ ] 实现键盘导航
- [ ] 添加行星信息面板
- [ ] 优化移动端体验

### 中期计划
- [ ] 集成真实邮件/短信服务
- [ ] 添加用户资料管理
- [ ] 实现多因素认证
- [ ] 添加第三方登录

### 长期计划
- [ ] 添加更多天体（卫星、小行星）
- [ ] VR/AR支持
- [ ] 多人协作功能
- [ ] 教育模式

---

## 📚 相关资源

### 文档
- [Three.js 官方文档](https://threejs.org/docs/)
- [WebGL 规范](https://www.khronos.org/webgl/)
- [Express.js 文档](https://expressjs.com/)

### 纹理资源
- [Solar System Scope](https://www.solarsystemscope.com/textures/)
- [NASA 3D Resources](https://nasa3d.arc.nasa.gov/)

### 学习资源
- [Three.js Journey](https://threejs-journey.com/)
- [WebGL Fundamentals](https://webglfundamentals.org/)

---

## 📄 许可证

ISC License

Copyright (c) 2026 SoftPx

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

---

## 👥 作者

**SoftPx**

- 项目维护者
- 功能开发
- 文档编写

---

## 🙏 致谢

- Three.js 团队提供优秀的3D引擎
- NASA 提供高质量纹理资源
- 所有贡献者的支持

---

## 📞 联系方式

如有问题或建议，欢迎：
- 提交 Issue
- 创建 Pull Request
- 查看文档

---

**最后更新**: 2026年2月25日  
**项目状态**: ✅ 稳定运行  
**版本**: v2.0.0
    float amp = 1.;
    float scale = 2.;
    for(int i = 0; i < 20; i++) {
        sum += snoise(p * scale) * amp;
        p.w += 100.;
        amp *= 0.7;
        scale *= 3.;
    }
    return sum;
}
```

### 大气层光晕

使用 Fresnel 效果实现边缘发光：

```glsl
float Fresnel(vec3 eyeVector, vec3 worldNormal) {
    return pow(1.0 + dot(eyeVector, worldNormal), 1.0);
}
```

## 🔧 配置说明

### Webpack 配置

**开发环境** (`config/webpack.dev.js`)：
- 端口：8095
- 热更新：启用
- Source Map：启用
- 自动打开浏览器

**生产环境** (`config/webpack.prod.js`)：
- 代码压缩：启用
- 代码混淆：可选
- 输出路径：`dist/js/main.js`

### 性能优化建议

1. **减少行星轨道分段数**：在 `planetsConfig.js` 中降低 `segments` 值
2. **简化 Shader**：减少噪声迭代次数
3. **使用低分辨率纹理**：压缩星球贴图
4. **限制渲染距离**：调整相机 `far` 参数

## 📝 开发指南

### 添加新行星

1. 在 `planetsConfig.js` 中添加配置：

```javascript
{
  name: '冥王星',
  orbitRadius: 180,
  size: 1.5,
  texture: '../Resources/贴图/星球/pluto.jpg',
  orbitSpeed: 0.05,
  rotationSpeed: 0.001,
  color: 0x8B7355,
  segments: 4096
}
```

2. 将纹理文件放入 `dist/Resources/贴图/星球/` 目录

### 修改 Shader 效果

编辑 `src/js/index.js` 中的着色器代码：
- `_VSSum` / `_FSSum`：太阳着色器
- `_VSAroud` / `_FSAroud`：大气层着色器

### 调整动画速度

修改 `animate()` 函数中的时间参数：

```javascript
material.uniforms.Time.value += 0.002; // 增大值加快动画
```

## 🐛 已知问题

- ⚠️ 行星比例非真实尺寸（已进行视觉优化）
- ⚠️ 轨道为圆形（实际应为椭圆）
- ⚠️ 缺少土星光环
- ⚠️ 移动端性能待优化

## 🗺️ 路线图

- [ ] 添加行星卫星系统
- [ ] 实现土星光环
- [ ] 添加彗星和小行星带
- [ ] 支持时间加速/减速
- [ ] 添加行星信息面板
- [ ] 优化移动端体验
- [ ] 添加 VR 支持
- [ ] 真实轨道计算（开普勒定律）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 ISC 许可证。

## 👨‍💻 作者

**SoftPx**

## 🙏 致谢

- [Three.js](https://threejs.org/) - 3D 渲染引擎
- [Tween.js](https://github.com/tweenjs/tween.js/) - 动画补间库
- 行星纹理来源：NASA 公开资源

---

⭐ 如果这个项目对你有帮助，请给它一个星标！

