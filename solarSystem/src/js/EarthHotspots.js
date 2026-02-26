import * as THREE from 'three';

/**
 * 地球热点区域管理类
 * 将地球表面划分为4平方米的可点击区域
 */
class EarthHotspots {
  constructor(earth, camera, domElement) {
    this.earth = earth;
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hotspots = [];
    this.hotspotsGroup = new THREE.Group();
    this.earth.add(this.hotspotsGroup);
    
    // 地球半径（米）- 实际地球半径约为6371000米
    this.EARTH_RADIUS = 6371000;
    
    // 目标区域面积（平方米）
    this.TARGET_AREA = 4;
    
    // 当前选中的热点
    this.selectedHotspot = null;
    
    // 初始化
    this.init();
  }

  /**
   * 初始化热点区域
   */
  init() {
    console.log('🌍 开始创建地球热点区域...');
    
    // 计算网格划分
    const gridData = this.calculateGrid();
    console.log(`📊 网格划分完成: ${gridData.latDivisions} × ${gridData.lonDivisions} = ${gridData.totalHotspots} 个区域`);
    
    // 创建热点
    this.createHotspots(gridData);
    
    // 绑定事件
    this.bindEvents();
    
    console.log('✅ 地球热点区域创建完成!');
  }

  /**
   * 计算网格划分
   * 基于目标面积计算经纬度的分割数
   */
  calculateGrid() {
    // 地球表面积
    const earthSurfaceArea = 4 * Math.PI * this.EARTH_RADIUS * this.EARTH_RADIUS;
    
    // 总热点数量（理论值）
    const totalHotspots = Math.floor(earthSurfaceArea / this.TARGET_AREA);
    
    // 计算纬度和经度的分割数
    // 纬度从北极(-90°)到南极(90°)，共180°
    // 经度从0°到360°
    
    // 使用近似方法：假设地球表面积均匀分布
    const approxDivisionsPerAxis = Math.sqrt(totalHotspots / 2);
    
    const latDivisions = Math.floor(approxDivisionsPerAxis); // 纬度分割数
    const lonDivisions = Math.floor(approxDivisionsPerAxis * 2); // 经度分割数（经度范围是纬度的2倍）
    
    return {
      latDivisions,
      lonDivisions,
      totalHotspots: latDivisions * lonDivisions,
      latStep: 180 / latDivisions, // 每个纬度格子的度数
      lonStep: 360 / lonDivisions  // 每个经度格子的度数
    };
  }

  /**
   * 创建热点区域
   */
  createHotspots(gridData) {
    const { latDivisions, lonDivisions, latStep, lonStep } = gridData;
    
    let hotspotId = 0;
    
    // 从北极点开始（纬度90°）
    for (let latIndex = 0; latIndex < latDivisions; latIndex++) {
      const lat = 90 - (latIndex + 0.5) * latStep; // 区域中心纬度
      
      // 从0度经度开始
      for (let lonIndex = 0; lonIndex < lonDivisions; lonIndex++) {
        const lon = (lonIndex + 0.5) * lonStep; // 区域中心经度
        
        // 创建热点数据
        const hotspot = {
          id: hotspotId++,
          lat: lat,
          lon: lon,
          latRange: {
            min: 90 - (latIndex + 1) * latStep,
            max: 90 - latIndex * latStep
          },
          lonRange: {
            min: lonIndex * lonStep,
            max: (lonIndex + 1) * lonStep
          }
        };
        
        // 创建可视化标记（仅为测试，生产环境可移除或设为不可见）
        const marker = this.createHotspotMarker(hotspot);
        hotspot.marker = marker;
        
        this.hotspots.push(hotspot);
      }
    }
    
    console.log(`✅ 创建了 ${this.hotspots.length} 个热点区域`);
  }

  /**
   * 创建热点标记（可视化，可选）
   */
  createHotspotMarker(hotspot) {
    // 将经纬度转换为3D坐标
    const position = this.latLonToVector3(hotspot.lat, hotspot.lon);
    
    // 创建一个小的透明球体作为标记（不可见，仅用于射线检测）
    const geometry = new THREE.SphereGeometry(0.02, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0, // 完全透明
      depthTest: false
    });
    
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    marker.userData = hotspot; // 存储热点数据
    
    this.hotspotsGroup.add(marker);
    
    return marker;
  }

  /**
   * 将经纬度转换为3D坐标（球面坐标）
   */
  latLonToVector3(lat, lon, radius = 2.6) {
    // Three.js中，地球的半径由模型大小决定，这里假设是2.6（根据实际模型调整）
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon) * (Math.PI / 180);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  }

  /**
   * 绑定鼠标事件
   */
  bindEvents() {
    this.domElement.addEventListener('click', (event) => this.onMouseClick(event), false);
    this.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
    
    // 监听搜索事件
    window.addEventListener('searchHotspot', (event) => this.onSearchHotspot(event), false);
  }

  /**
   * 处理搜索热点事件
   */
  onSearchHotspot(event) {
    const hotspotId = event.detail.hotspotId;
    this.navigateToHotspot(hotspotId);
  }

  /**
   * 导航到指定ID的热点
   */
  navigateToHotspot(hotspotId) {
    // 验证ID范围
    if (hotspotId < 0 || hotspotId >= this.hotspots.length) {
      console.error(`热点ID ${hotspotId} 超出范围 (0-${this.hotspots.length - 1})`);
      this.showSearchResult(`地块 #${hotspotId} 不存在`, 'error');
      return;
    }

    const hotspot = this.hotspots[hotspotId];
    if (!hotspot) {
      console.error(`找不到热点 #${hotspotId}`);
      this.showSearchResult(`地块 #${hotspotId} 不存在`, 'error');
      return;
    }

    console.log(`导航到热点 #${hotspotId}:`, hotspot);

    // 计算目标位置（热点位置）
    const targetPosition = this.latLonToVector3(hotspot.lat, hotspot.lon, 2.6);

    // 计算相机位置（在目标位置外侧一定距离）
    const cameraDistance = 5; // 相机距离地表的距离
    const cameraPosition = this.latLonToVector3(hotspot.lat, hotspot.lon, 2.6 + cameraDistance);

    // 使用TWEEN平滑移动相机
    if (window.TWEEN) {
      const currentPos = this.camera.position.clone();
      
      new TWEEN.Tween(currentPos)
        .to({
          x: cameraPosition.x,
          y: cameraPosition.y,
          z: cameraPosition.z
        }, 2000) // 2秒动画
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          this.camera.position.copy(currentPos);
          this.camera.lookAt(0, 0, 0); // 始终看向地球中心
        })
        .onComplete(() => {
          console.log('导航完成');
          // 触发点击事件显示热点信息
          this.onHotspotClick(hotspot);
          this.showSearchResult(`已定位到地块 #${hotspotId}`, 'success');
        })
        .start();
    } else {
      // 如果没有TWEEN，直接设置位置
      this.camera.position.copy(cameraPosition);
      this.camera.lookAt(0, 0, 0);
      this.onHotspotClick(hotspot);
      this.showSearchResult(`已定位到地块 #${hotspotId}`, 'success');
    }
  }

  /**
   * 显示搜索结果消息
   */
  showSearchResult(message, type = 'success') {
    const resultDiv = document.getElementById('search-result');
    if (resultDiv) {
      resultDiv.textContent = message;
      resultDiv.className = type === 'success' ? 'search-success' : 'search-error';
      resultDiv.style.display = 'block';

      // 3秒后自动隐藏
      setTimeout(() => {
        resultDiv.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * 鼠标点击事件
   */
  onMouseClick(event) {
    // 计算鼠标位置
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // 更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // 检测与地球的交互
    const earthMesh = this.findEarthMesh(this.earth);
    if (!earthMesh) return;
    
    const intersects = this.raycaster.intersectObject(earthMesh, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const hotspot = this.findHotspotByPoint(point);
      
      if (hotspot) {
        this.onHotspotClick(hotspot);
      }
    }
  }

  /**
   * 鼠标移动事件（可选，用于悬停效果）
   */
  onMouseMove(event) {
    // 可以在这里实现悬停高亮效果
  }

  /**
   * 查找地球网格对象
   */
  findEarthMesh(object) {
    if (object.type === 'Mesh' && object.geometry && object.geometry.type === 'SphereGeometry') {
      return object;
    }
    
    for (let child of object.children) {
      const found = this.findEarthMesh(child);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * 根据3D点查找对应的热点
   */
  findHotspotByPoint(point) {
    // 将3D坐标转换回经纬度
    const latLon = this.vector3ToLatLon(point);
    
    // 查找包含该经纬度的热点
    return this.hotspots.find(hotspot => {
      return latLon.lat >= hotspot.latRange.min &&
             latLon.lat <= hotspot.latRange.max &&
             latLon.lon >= hotspot.lonRange.min &&
             latLon.lon <= hotspot.lonRange.max;
    });
  }

  /**
   * 将3D坐标转换为经纬度
   */
  vector3ToLatLon(point) {
    const radius = point.length();
    const lat = 90 - (Math.acos(point.y / radius)) * 180 / Math.PI;
    const lon = ((Math.atan2(point.z, point.x)) * 180 / Math.PI + 360) % 360;
    
    return { lat, lon };
  }

  /**
   * 热点点击处理
   */
  onHotspotClick(hotspot) {
    console.log('🎯 点击热点:', hotspot);
    
    this.selectedHotspot = hotspot;
    
    // 显示信息面板
    this.showHotspotInfo(hotspot);
    
    // 高亮选中的区域（可选）
    this.highlightHotspot(hotspot);
  }

  /**
   * 显示热点信息
   */
  showHotspotInfo(hotspot) {
    // 触发自定义事件，让外部UI处理显示
    const event = new CustomEvent('hotspotClick', {
      detail: hotspot
    });
    window.dispatchEvent(event);
  }

  /**
   * 高亮显示热点（可选）
   */
  highlightHotspot(hotspot) {
    // 清除之前的高亮
    if (this.selectedHotspot && this.selectedHotspot.marker) {
      this.selectedHotspot.marker.material.opacity = 0;
    }
    
    // 高亮当前热点
    if (hotspot.marker) {
      hotspot.marker.material.opacity = 0.3;
      hotspot.marker.material.color.setHex(0xff0000);
    }
  }

  /**
   * 获取热点统计信息
   */
  getStatistics() {
    return {
      totalHotspots: this.hotspots.length,
      earthRadius: this.EARTH_RADIUS,
      targetArea: this.TARGET_AREA,
      actualAverageArea: (4 * Math.PI * this.EARTH_RADIUS * this.EARTH_RADIUS) / this.hotspots.length
    };
  }

  /**
   * 导出热点数据
   */
  exportHotspots() {
    return this.hotspots.map(h => ({
      id: h.id,
      lat: h.lat.toFixed(6),
      lon: h.lon.toFixed(6),
      latRange: {
        min: h.latRange.min.toFixed(6),
        max: h.latRange.max.toFixed(6)
      },
      lonRange: {
        min: h.lonRange.min.toFixed(6),
        max: h.lonRange.max.toFixed(6)
      }
    }));
  }

  /**
   * 销毁
   */
  dispose() {
    this.domElement.removeEventListener('click', this.onMouseClick);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('searchHotspot', this.onSearchHotspot);
    
    // 清理标记
    this.hotspotsGroup.clear();
    this.earth.remove(this.hotspotsGroup);
  }
}

export default EarthHotspots;
