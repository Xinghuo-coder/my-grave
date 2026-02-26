# 🔍 地球热点搜索功能指南

## 功能概述

地球热点搜索功能允许用户通过输入地块编号快速定位并导航到地球表面的任意4平方米区域。

## 特性

✅ **快速搜索**：通过地块编号（0-127,000,000）快速定位  
✅ **平滑导航**：相机自动平滑飞行到目标地块  
✅ **信息展示**：自动显示目标地块的详细坐标信息  
✅ **输入验证**：智能验证输入，防止无效搜索  
✅ **用户反馈**：实时显示搜索结果和错误提示  

---

## 使用方法

### 1. 打开搜索框

搜索框位于主页面左上角，登录后自动显示。

### 2. 输入地块编号

- **有效范围**：0 - 127,000,000
- **起始点**：编号0位于北极点0度经度
- **递增规则**：从北极开始，按经纬度顺序递增

### 3. 执行搜索

两种方式触发搜索：
- 点击"定位"按钮
- 在输入框中按 Enter 键

### 4. 查看结果

搜索成功后：
- 相机平滑飞向目标地块（2秒动画）
- 自动显示地块详细信息面板
- 包含：地块编号、中心坐标、经纬度范围

---

## 技术实现

### 前端 UI (dist/index.html)

```html
<!-- 搜索框 -->
<div class="hotspot-search" id="hotspot-search">
  <input 
    type="number" 
    id="hotspot-search-input" 
    placeholder="输入地块编号 (0-127000000)"
    min="0"
    max="127000000"
  >
  <button onclick="searchHotspot()">定位</button>
</div>

<!-- 结果提示 -->
<div id="search-result" style="display: none;"></div>
```

### JavaScript 搜索函数

```javascript
function searchHotspot() {
  const input = document.getElementById('hotspot-search-input');
  const hotspotId = parseInt(input.value);
  
  // 验证输入
  if (isNaN(hotspotId) || hotspotId < 0) {
    showError('请输入有效的地块编号');
    return;
  }
  
  if (hotspotId >= 127000000) {
    showError('地块编号超出范围（最大值：127,000,000）');
    return;
  }
  
  // 触发自定义事件
  const event = new CustomEvent('searchHotspot', {
    detail: { hotspotId }
  });
  window.dispatchEvent(event);
  
  // 显示加载状态
  showResult(`正在定位到地块 #${hotspotId}...`, 'loading');
}
```

### 后端处理 (EarthHotspots.js)

#### 1. 事件监听

```javascript
bindEvents() {
  // ... 其他事件监听
  window.addEventListener('searchHotspot', (event) => {
    this.onSearchHotspot(event);
  }, false);
}

onSearchHotspot(event) {
  const hotspotId = event.detail.hotspotId;
  this.navigateToHotspot(hotspotId);
}
```

#### 2. 导航实现

```javascript
navigateToHotspot(hotspotId) {
  // 验证ID
  if (hotspotId < 0 || hotspotId >= this.hotspots.length) {
    this.showSearchResult(`地块 #${hotspotId} 不存在`, 'error');
    return;
  }

  const hotspot = this.hotspots[hotspotId];
  
  // 计算3D位置
  const targetPosition = this.latLonToVector3(
    hotspot.lat, 
    hotspot.lon, 
    2.6
  );
  
  const cameraDistance = 5;
  const cameraPosition = this.latLonToVector3(
    hotspot.lat, 
    hotspot.lon, 
    2.6 + cameraDistance
  );

  // TWEEN平滑动画
  const currentPos = this.camera.position.clone();
  
  new TWEEN.Tween(currentPos)
    .to({
      x: cameraPosition.x,
      y: cameraPosition.y,
      z: cameraPosition.z
    }, 2000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onUpdate(() => {
      this.camera.position.copy(currentPos);
      this.camera.lookAt(0, 0, 0);
    })
    .onComplete(() => {
      // 显示热点信息
      this.onHotspotClick(hotspot);
      this.showSearchResult(`已定位到地块 #${hotspotId}`, 'success');
    })
    .start();
}
```

#### 3. 坐标转换

```javascript
latLonToVector3(lat, lon, radius = 2.6) {
  // 球面坐标转换为笛卡尔坐标
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon) * (Math.PI / 180);
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}
```

---

## 数据结构

### 热点对象

```javascript
{
  id: 12345,              // 唯一编号 (0-127,000,000)
  lat: 45.123456,         // 中心纬度
  lon: -122.654321,       // 中心经度
  latRange: {
    min: 45.1,            // 纬度范围最小值
    max: 45.2             // 纬度范围最大值
  },
  lonRange: {
    min: -122.7,          // 经度范围最小值
    max: -122.6           // 经度范围最大值
  }
}
```

### 搜索事件

```javascript
// 自定义事件
{
  type: 'searchHotspot',
  detail: {
    hotspotId: 12345      // 要搜索的地块编号
  }
}
```

---

## 编号规则

### 起点
- **北极点**：纬度 90°
- **本初子午线**：经度 0°
- **编号**：0

### 递增规则
1. 从北纬90度开始，向南递减
2. 每个纬度带内，经度从0度向东递增
3. 编号连续递增，无间隔

### 示例
```
编号 0      → 北极点 (90°N, 0°E)
编号 1      → 北极附近 (90°N, 经度+1格)
编号 100    → 北极附近 (90°N, 经度+100格)
编号 10000  → 高纬度地区
编号 1000000 → 中纬度地区
...
编号 127000000 → 南极附近
```

---

## CSS 样式

### 搜索框样式

```css
.hotspot-search {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 10px;
  z-index: 1000;
  display: flex;
  gap: 10px;
}

.hotspot-search input {
  padding: 8px 12px;
  border: 2px solid #4CAF50;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  width: 250px;
}

.hotspot-search button {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.hotspot-search button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}
```

### 结果提示样式

```css
#search-result {
  position: fixed;
  top: 80px;
  left: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

.search-success {
  background: rgba(76, 175, 80, 0.9);
  color: white;
}

.search-error {
  background: rgba(244, 67, 54, 0.9);
  color: white;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 错误处理

### 输入验证

| 错误类型 | 提示信息 | 处理方式 |
|---------|---------|---------|
| 非数字输入 | "请输入有效的地块编号" | 显示错误提示，不执行搜索 |
| 负数 | "请输入有效的地块编号" | 显示错误提示 |
| 超出范围 | "地块编号超出范围" | 显示错误提示 |
| 空值 | "请输入有效的地块编号" | 显示错误提示 |

### 导航错误

| 错误类型 | 提示信息 | 处理方式 |
|---------|---------|---------|
| 热点不存在 | "地块 #X 不存在" | 显示错误，终止导航 |
| 系统未初始化 | 控制台错误 | 不显示用户提示 |

---

## 性能优化

### 1. 直接索引访问
```javascript
// 使用数组索引直接访问，O(1)时间复杂度
const hotspot = this.hotspots[hotspotId];
```

### 2. TWEEN动画优化
```javascript
// 使用二次缓动，平滑自然
.easing(TWEEN.Easing.Quadratic.InOut)
```

### 3. 结果缓存
- 热点数据初始化时生成，不重复计算
- 坐标转换使用预定义公式，避免重复计算

---

## 用户体验

### 1. 即时反馈
- 输入验证立即显示
- 搜索开始显示加载状态
- 导航完成显示成功提示

### 2. 多种触发方式
- 按钮点击
- Enter键快捷键
- 未来可扩展：语音搜索、批量导航

### 3. 自动隐藏提示
- 成功/错误提示3秒后自动消失
- 不遮挡主要视图

---

## 扩展功能建议

### 1. 历史记录
```javascript
// 保存最近搜索
localStorage.setItem('recentSearches', JSON.stringify([...]));
```

### 2. 快捷跳转
```javascript
// 预设热点
const presets = {
  '北京': 45678901,
  '纽约': 23456789,
  '东京': 67890123
};
```

### 3. 批量导航
```javascript
// 巡航模式
function tourHotspots(idList, interval = 5000) {
  idList.forEach((id, index) => {
    setTimeout(() => navigateToHotspot(id), index * interval);
  });
}
```

### 4. 地址搜索
```javascript
// 集成地理编码API
async function searchByAddress(address) {
  const coords = await geocode(address);
  const hotspotId = findNearestHotspot(coords);
  navigateToHotspot(hotspotId);
}
```

---

## 常见问题

### Q1: 搜索后相机没有移动？
**A**: 检查以下几点：
- TWEEN库是否正确加载（查看控制台）
- 热点系统是否初始化（查看控制台日志）
- 输入的编号是否在有效范围内

### Q2: 如何找到特定位置的编号？
**A**: 有两种方式：
1. 点击地球表面，在弹出的信息面板中查看编号
2. 使用经纬度计算公式（见下方）

### Q3: 动画速度可以调整吗？
**A**: 可以，修改 `navigateToHotspot` 方法中的时间参数：
```javascript
.to({...}, 2000)  // 2000ms = 2秒，可修改为其他值
```

---

## 经纬度转编号公式

```javascript
function coordsToHotspotId(lat, lon) {
  const gridData = calculateGrid();
  const { latDivisions, lonDivisions, latStep, lonStep } = gridData;
  
  // 计算纬度索引（从北极开始）
  const latIndex = Math.floor((90 - lat) / latStep);
  
  // 计算经度索引
  const lonIndex = Math.floor(lon / lonStep);
  
  // 计算编号
  const hotspotId = latIndex * lonDivisions + lonIndex;
  
  return hotspotId;
}
```

---

## 相关文档

- [地球热点系统完整指南](./EARTH_HOTSPOTS_GUIDE.md)
- [快速开始](./QUICK_START.md)
- [API文档](./README.md#api文档)

---

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 实现基础搜索功能
- ✅ 添加输入验证
- ✅ 实现平滑导航动画
- ✅ 添加用户反馈提示
- ✅ 支持Enter键快捷搜索

---

**🌍 享受探索地球的每一个角落！**
