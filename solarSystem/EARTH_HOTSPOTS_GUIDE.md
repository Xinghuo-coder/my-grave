# 地球热点区域功能使用指南

## 功能概述

地球热点区域功能将地球表面划分为约**127,000,000个**4平方米的区域，每个区域都可以点击并查看详细的坐标信息。每个区域都有唯一的编号，从0开始递增。

## 核心特性

### 1. 区域划分
- **区域大小**: 每个热点区域约为 4 平方米
- **总区域数**: 约 127,000,000 个（127百万个）
- **编号规则**: 从北极点（纬度90°，经度0°）开始，按纬度从北到南，经度从西到东的顺序递增

### 2. 点击交互
- 点击地球表面任意位置，系统会自动识别最近的热点区域
- 显示该区域的详细信息：
  - 区域编号
  - 中心坐标（纬度、经度）
  - 区域范围（纬度范围、经度范围）

### 3. 数据管理
- 用户可以保存感兴趣的热点区域
- 为区域添加备注信息
- 查看个人保存的所有区域
- 删除不需要的区域记录

## 技术实现

### 网格计算算法

```javascript
// 地球表面积
const earthSurfaceArea = 4 * π * R²

// 总区域数
const totalHotspots = floor(earthSurfaceArea / targetArea)

// 纬度划分（约12742个）
const latDivisions = ceil(sqrt(totalHotspots / 2))

// 经度划分（根据纬度动态调整）
const lonDivisions = ceil(2 * π * R * cos(lat) / sqrt(targetArea))
```

### 坐标转换

#### 经纬度转3D坐标
```javascript
x = R * cos(lat) * cos(lon)
y = R * sin(lat)
z = -R * cos(lat) * sin(lon)
```

#### 3D坐标转经纬度
```javascript
r = sqrt(x² + y² + z²)
lat = asin(y / r)
lon = atan2(-z, x)
```

### 射线检测（Raycasting）
使用Three.js的Raycaster进行点击检测：
1. 将鼠标2D坐标转换为归一化设备坐标
2. 从相机发射射线穿过点击点
3. 计算射线与地球球体的交点
4. 将交点转换为经纬度
5. 查找最近的热点区域

## 使用方法

### 基本用法

#### 1. 初始化系统
```javascript
import EarthHotspots from './EarthHotspots.js';
import EarthHotspotsUI from './EarthHotspotsUI.js';

// 创建UI管理器
const ui = new EarthHotspotsUI();

// 创建热点系统
const hotspots = new EarthHotspots(
  earthMesh,      // 地球网格对象
  camera,         // Three.js相机
  renderer.domElement  // 渲染画布
);

// 创建热点
hotspots.createHotspots();

// 获取统计信息
const stats = hotspots.getStatistics();
ui.updateStatistics(stats);
```

#### 2. 监听热点点击事件
```javascript
window.addEventListener('hotspotClick', (event) => {
  const hotspot = event.detail;
  console.log('区域编号:', hotspot.id);
  console.log('中心坐标:', hotspot.lat, hotspot.lon);
  console.log('纬度范围:', hotspot.latRange);
  console.log('经度范围:', hotspot.lonRange);
});
```

#### 3. 保存热点信息
```javascript
async function saveHotspot(hotspot) {
  const response = await fetch('http://localhost:3000/api/earth/save-hotspot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      id: hotspot.id,
      lat: hotspot.lat,
      lon: hotspot.lon,
      latRange: hotspot.latRange,
      lonRange: hotspot.lonRange,
      note: '这是一个有趣的区域'
    })
  });
  
  const result = await response.json();
  console.log(result);
}
```

### API接口

#### 1. 保存热点
- **URL**: `POST /api/earth/save-hotspot`
- **Body**:
```json
{
  "id": 12345,
  "lat": 45.5231,
  "lon": -122.6765,
  "latRange": { "min": 45.52, "max": 45.53 },
  "lonRange": { "min": -122.68, "max": -122.67 },
  "note": "可选的备注信息"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "热点信息已保存",
  "hotspotId": 12345
}
```

#### 2. 获取我的热点列表
- **URL**: `GET /api/earth/my-hotspots`
- **Response**:
```json
{
  "success": true,
  "hotspots": [
    {
      "id": 12345,
      "lat": 45.5231,
      "lon": -122.6765,
      "lat_range_min": 45.52,
      "lat_range_max": 45.53,
      "lon_range_min": -122.68,
      "lon_range_max": -122.67,
      "user_id": 1,
      "note": "备注信息",
      "created_at": "2024-01-01 12:00:00",
      "updated_at": "2024-01-01 12:00:00"
    }
  ]
}
```

#### 3. 获取热点详情
- **URL**: `GET /api/earth/hotspot/:id`
- **Response**:
```json
{
  "success": true,
  "hotspot": { /* 热点详细信息 */ }
}
```

#### 4. 删除热点
- **URL**: `DELETE /api/earth/hotspot/:id`
- **Response**:
```json
{
  "success": true,
  "message": "热点已删除"
}
```

#### 5. 获取统计信息
- **URL**: `GET /api/earth/statistics`
- **Response**:
```json
{
  "success": true,
  "statistics": {
    "total_saved": 10,
    "first_saved": "2024-01-01 12:00:00",
    "last_updated": "2024-01-05 15:30:00"
  }
}
```

## 性能优化

### 1. 按需加载
为了避免一次性创建1.27亿个对象导致内存溢出，系统采用以下优化策略：

```javascript
// 只在需要时计算网格
calculateGrid() {
  // 返回网格参数而非实际创建所有对象
  return {
    latDivisions,
    lonDivisions,
    latStep,
    lonStep,
    totalHotspots
  };
}

// 点击时动态查找最近的热点
findHotspotByPoint(lat, lon) {
  // 根据经纬度直接计算区域ID
  const latIndex = Math.floor((90 - lat) / latStep);
  const lonIndex = Math.floor((lon + 180) / lonStep);
  const hotspotId = latIndex * lonDivisions + lonIndex;
  
  return this.generateHotspotData(hotspotId, lat, lon);
}
```

### 2. 数据库索引
数据库表使用了以下索引优化查询性能：
- 主键索引：`id`
- 用户索引：`user_id`

### 3. 缓存策略
- 统计信息缓存
- 最近访问的热点缓存
- 用户保存的热点缓存

## UI组件

### 信息面板
显示选中热点的详细信息：
- 区域编号（带渐变背景的徽章）
- 中心坐标（纬度、经度）
- 区域范围（最小值~最大值）
- 操作按钮（复制坐标、保存信息）

### 统计面板
显示全局统计信息：
- 总区域数
- 目标面积
- 地球半径
- 当前选中区域

### 提示信息
- 初次加载时显示操作提示
- 操作成功/失败的消息提示

## 样式定制

### CSS类名
```css
.earth-hotspot-panel        /* 信息面板容器 */
.hotspot-panel-header       /* 面板头部 */
.hotspot-panel-content      /* 面板内容 */
.hotspot-id-badge          /* 区域编号徽章 */
.hotspot-coordinates       /* 坐标显示区域 */
.range-grid                /* 范围显示网格 */
.earth-stats-panel         /* 统计面板 */
.earth-hint                /* 提示信息 */
```

### 自定义主题
修改CSS变量来自定义颜色主题：
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: rgba(20, 20, 40, 0.95);
  --text-color: #ffffff;
}
```

## 常见问题

### Q: 为什么点击地球没有反应？
A: 请确保：
1. 已经登录系统
2. 热点系统已正确初始化
3. 浏览器控制台没有错误信息
4. 正在点击地球表面而非空白区域

### Q: 热点加载很慢怎么办？
A: 系统采用按需计算策略，不会一次性创建所有热点。如果仍然很慢，可能是：
1. 网络连接问题
2. 设备性能限制
3. 浏览器兼容性问题

### Q: 如何导出所有保存的热点？
A: 可以通过API获取：
```javascript
const response = await fetch('http://localhost:3000/api/earth/my-hotspots', {
  credentials: 'include'
});
const data = await response.json();
console.log(data.hotspots);
```

### Q: 可以修改区域大小吗？
A: 可以，修改`TARGET_AREA`常量：
```javascript
// 在 EarthHotspots.js 中
this.TARGET_AREA = 4;  // 修改为其他值（平方米）
```

## 未来计划

- [ ] 支持区域标签和分类
- [ ] 区域搜索功能
- [ ] 导出/导入热点数据
- [ ] 3D可视化热点密度
- [ ] 多用户协作功能
- [ ] 区域共享功能
- [ ] 移动端优化
- [ ] 离线缓存支持

## 相关文件

### 前端
- `src/js/EarthHotspots.js` - 核心热点管理类
- `src/js/EarthHotspotsUI.js` - UI管理类
- `src/css/earthHotspots.css` - 样式文件

### 后端
- `server/routes/earth.js` - API路由
- `server/database/db.js` - 数据库连接

### 数据库
- 表名: `earth_hotspots`
- 字段:
  - `id` - 区域编号（主键）
  - `lat` - 中心纬度
  - `lon` - 中心经度
  - `lat_range_min/max` - 纬度范围
  - `lon_range_min/max` - 经度范围
  - `user_id` - 用户ID（外键）
  - `note` - 备注
  - `created_at` - 创建时间
  - `updated_at` - 更新时间

## 技术栈

- **Three.js**: 3D渲染和射线检测
- **Express.js**: 后端API服务
- **SQLite**: 数据持久化
- **Vanilla JavaScript**: 前端逻辑
- **CSS3**: 界面样式和动画

## 贡献指南

欢迎贡献代码！请遵循以下步骤：
1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
