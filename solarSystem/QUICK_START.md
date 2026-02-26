# 地球热点功能快速开始指南

## 🚀 快速启动

### 1. 安装依赖
```bash
cd solarSystem
npm install
```

### 2. 启动服务器
```bash
# 同时启动前端和后端
npm start

# 或者分别启动
npm run server     # 启动后端服务器 (http://localhost:3000)
npm run dev        # 启动前端开发服务器 (http://localhost:8095)
```

### 3. 访问应用
打开浏览器访问: http://localhost:8095

### 4. 登录系统
- 如果没有账号,先注册
- 使用手机号或邮箱注册
- 输入验证码(开发模式会在控制台显示)
- 登录成功后会自动跳转到主页面

### 5. 使用地球热点功能
1. 登录后会看到太阳系可视化界面
2. 双击地球可以聚焦到地球
3. 单击地球表面任意位置
4. 会弹出热点信息面板,显示:
   - 区域编号(从0开始)
   - 中心坐标(纬度、经度)
   - 区域范围
5. 可以复制坐标或保存区域信息

## 📊 技术架构

### 前端
- **Three.js**: 3D渲染引擎
- **EarthHotspots.js**: 地球热点管理
- **EarthHotspotsUI.js**: UI界面管理
- **Webpack**: 打包工具

### 后端
- **Express.js**: Web框架
- **SQLite**: 数据库
- **bcrypt**: 密码加密
- **express-session**: 会话管理

## 🗂️ 项目结构

```
solarSystem/
├── src/
│   ├── js/
│   │   ├── index.js              # 主入口文件
│   │   ├── EarthHotspots.js      # 地球热点核心类
│   │   ├── EarthHotspotsUI.js    # 热点UI管理
│   │   └── auth.js               # 认证逻辑
│   ├── css/
│   │   └── earthHotspots.css     # 热点样式
│   └── auth.html                 # 登录注册页面
├── server/
│   ├── index.js                  # 后端服务器
│   ├── routes/
│   │   ├── auth.js              # 认证路由
│   │   └── earth.js             # 地球热点路由
│   ├── models/
│   │   └── User.js              # 用户模型
│   └── database/
│       └── db.js                # 数据库连接
└── dist/                         # 编译输出目录
```

## 📡 API接口

### 认证相关
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/check` - 检查登录状态

### 地球热点相关
- `POST /api/earth/save-hotspot` - 保存热点
- `GET /api/earth/my-hotspots` - 获取我的热点列表
- `GET /api/earth/hotspot/:id` - 获取热点详情
- `DELETE /api/earth/hotspot/:id` - 删除热点
- `GET /api/earth/statistics` - 获取统计信息

## 🎯 核心功能

### 1. 地球热点系统
- **总区域数**: ~127,000,000 个
- **区域大小**: 每个约 4 平方米
- **编号规则**: 从北极点0°经度开始,按纬度从北到南、经度从西到东递增
- **实时点击**: 使用射线检测(Raycasting)实现精确点击

### 2. 坐标系统
```javascript
// 经纬度 → 3D坐标
x = R * cos(lat) * cos(lon)
y = R * sin(lat)
z = -R * cos(lat) * sin(lon)

// 3D坐标 → 经纬度
lat = asin(y / R)
lon = atan2(-z, x)
```

### 3. 网格计算
```javascript
// 地球表面积
earthSurface = 4 * π * R² ≈ 510,000,000 km²

// 4平方米区域总数
totalHotspots = earthSurface / 4 ≈ 127,500,000

// 纬度划分
latDivisions ≈ 12,742

// 经度划分(随纬度变化)
lonDivisions = 2 * π * R * cos(lat) / √4
```

## 💡 使用技巧

### 1. 快速定位
双击地球可以快速聚焦到地球视图

### 2. 精确点击
单击地球表面任意位置即可查看该区域信息

### 3. 保存常用区域
点击"保存信息"按钮可以保存感兴趣的区域

### 4. 复制坐标
点击"复制坐标"按钮可以快速复制坐标信息

### 5. 查看统计
左下角显示全局统计信息:
- 总区域数
- 当前选中区域
- 地球参数

## 🔧 开发指南

### 修改区域大小
在 `src/js/EarthHotspots.js` 中修改:
```javascript
this.TARGET_AREA = 4;  // 修改为其他值(平方米)
```

### 自定义UI样式
修改 `src/css/earthHotspots.css`:
```css
:root {
  --primary-color: #667eea;      /* 主色调 */
  --secondary-color: #764ba2;    /* 次色调 */
  --background: rgba(20,20,40,.95); /* 背景色 */
}
```

### 添加自定义功能
在 `src/js/EarthHotspotsUI.js` 中添加新方法

## 🐛 常见问题

### Q: 编译警告怎么办?
A: 警告是因为Three.js版本升级导致的API变化,不影响功能。可以忽略。

### Q: 点击地球没反应?
A: 确保:
1. 已经登录
2. 控制台没有错误
3. 点击的是地球表面而非其他星球

### Q: 数据库在哪里?
A: SQLite数据库文件在 `server/database/solar_system.db`

### Q: 如何清空数据?
A: 删除数据库文件后重启服务器会自动重新创建

## 📝 npm 脚本

```json
{
  "dev": "webpack-dev-server --config ./config/webpack.dev.js",
  "build": "webpack --config ./config/webpack.prod.js",
  "server": "node server/index.js",
  "server:dev": "nodemon server/index.js",
  "start": "concurrently \"npm run server:dev\" \"npm run dev\"",
  "test": "node server/test.js"
}
```

## 🎨 UI组件

### 热点信息面板
- 区域编号徽章(渐变背景)
- 坐标显示(纬度/经度)
- 范围显示(最小值~最大值)
- 操作按钮(复制/保存)

### 统计面板
- 全局统计信息
- 实时更新选中区域
- 固定在左下角

### 提示信息
- 初次加载提示
- 操作成功/失败消息
- 自动淡出效果

## 📚 相关文档

- [完整功能指南](./EARTH_HOTSPOTS_GUIDE.md) - 详细的技术文档
- [README.md](./README.md) - 项目整体说明
- [Three.js文档](https://threejs.org/docs/) - Three.js官方文档

## 🔒 安全说明

### 开发模式
- 验证码会在控制台显示
- CORS允许本地跨域
- Cookie不使用HTTPS

### 生产模式
需要修改:
1. 关闭验证码控制台输出
2. 配置正确的CORS origin
3. 启用HTTPS和secure cookie
4. 配置真实的邮件/短信服务

## 🤝 贡献

欢迎提交Issues和Pull Requests!

## 📄 许可证

MIT License

---

**开始探索地球的每一个角落吧! 🌍**
