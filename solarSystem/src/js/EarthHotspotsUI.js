/**
 * 地球热点UI管理器
 * 负责显示热点信息面板和统计信息
 */
class EarthHotspotsUI {
  constructor() {
    this.currentHotspot = null;
    this.init();
    this.bindEvents();
  }

  init() {
    // 创建信息面板
    this.createHotspotPanel();
    
    // 创建统计面板
    this.createStatsPanel();
    
    // 创建提示信息
    this.createHint();
  }

  /**
   * 创建热点信息面板
   */
  createHotspotPanel() {
    const panel = document.createElement('div');
    panel.className = 'earth-hotspot-panel';
    panel.id = 'earth-hotspot-panel';
    panel.innerHTML = `
      <div class="hotspot-panel-header">
        <h3 class="hotspot-panel-title">🌍 地球区域信息</h3>
        <button class="hotspot-panel-close" id="close-hotspot-panel">&times;</button>
      </div>
      <div class="hotspot-panel-content">
        <div class="hotspot-info-group">
          <div class="hotspot-info-label">区域编号</div>
          <div class="hotspot-id-badge" id="hotspot-id">-</div>
        </div>
        
        <div class="hotspot-info-group">
          <div class="hotspot-info-label">中心坐标</div>
          <div class="hotspot-coordinates">
            <div class="coordinate-item">
              <div class="coordinate-label">纬度 (Latitude)</div>
              <div class="coordinate-value" id="hotspot-lat">-</div>
            </div>
            <div class="coordinate-item">
              <div class="coordinate-label">经度 (Longitude)</div>
              <div class="coordinate-value" id="hotspot-lon">-</div>
            </div>
          </div>
        </div>
        
        <div class="hotspot-info-group">
          <div class="hotspot-range-section">
            <div class="hotspot-range-title">区域范围</div>
            <div class="range-grid">
              <div class="range-item">
                <div class="range-label">纬度范围</div>
                <div class="range-values">
                  <span class="range-min" id="lat-min">-</span>
                  <span class="range-separator">~</span>
                  <span class="range-max" id="lat-max">-</span>
                </div>
              </div>
              <div class="range-item">
                <div class="range-label">经度范围</div>
                <div class="range-values">
                  <span class="range-min" id="lon-min">-</span>
                  <span class="range-separator">~</span>
                  <span class="range-max" id="lon-max">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hotspot-panel-footer">
        <button class="hotspot-action-btn btn-secondary" id="copy-coordinates">📋 复制坐标</button>
        <button class="hotspot-action-btn btn-primary" id="save-hotspot">💾 保存信息</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.panel = panel;
  }

  /**
   * 创建统计信息面板
   */
  createStatsPanel() {
    const statsPanel = document.createElement('div');
    statsPanel.className = 'earth-stats-panel';
    statsPanel.id = 'earth-stats-panel';
    statsPanel.innerHTML = `
      <div class="stats-title">📊 地球区域统计</div>
      <div class="stats-item">
        <span class="stats-label">总区域数</span>
        <span class="stats-value" id="total-hotspots">-</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">目标面积</span>
        <span class="stats-value" id="target-area">4 m²</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">地球半径</span>
        <span class="stats-value">6,371 km</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">已选区域</span>
        <span class="stats-value" id="selected-hotspot">未选择</span>
      </div>
    `;
    
    document.body.appendChild(statsPanel);
    this.statsPanel = statsPanel;
  }

  /**
   * 创建提示信息
   */
  createHint() {
    const hint = document.createElement('div');
    hint.className = 'earth-hint';
    hint.id = 'earth-hint';
    hint.textContent = '💡 点击地球表面查看区域信息';
    
    document.body.appendChild(hint);
    this.hint = hint;
    
    // 5秒后自动隐藏
    setTimeout(() => {
      hint.style.opacity = '0';
      setTimeout(() => hint.remove(), 500);
    }, 5000);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 监听热点点击事件
    window.addEventListener('hotspotClick', (e) => {
      this.showHotspot(e.detail);
    });
    
    // 关闭按钮
    document.addEventListener('click', (e) => {
      if (e.target.id === 'close-hotspot-panel') {
        this.hidePanel();
      }
      
      // 复制坐标
      if (e.target.id === 'copy-coordinates') {
        this.copyCoordinates();
      }
      
      // 保存信息
      if (e.target.id === 'save-hotspot') {
        this.saveHotspot();
      }
    });
    
    // ESC键关闭面板
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panel.classList.contains('show')) {
        this.hidePanel();
      }
    });
  }

  /**
   * 显示热点信息
   */
  showHotspot(hotspot) {
    this.currentHotspot = hotspot;
    
    // 更新面板内容
    document.getElementById('hotspot-id').textContent = `#${hotspot.id}`;
    document.getElementById('hotspot-lat').textContent = `${hotspot.lat.toFixed(6)}°`;
    document.getElementById('hotspot-lon').textContent = `${hotspot.lon.toFixed(6)}°`;
    
    document.getElementById('lat-min').textContent = `${hotspot.latRange.min.toFixed(2)}°`;
    document.getElementById('lat-max').textContent = `${hotspot.latRange.max.toFixed(2)}°`;
    document.getElementById('lon-min').textContent = `${hotspot.lonRange.min.toFixed(2)}°`;
    document.getElementById('lon-max').textContent = `${hotspot.lonRange.max.toFixed(2)}°`;
    
    // 更新统计面板
    document.getElementById('selected-hotspot').textContent = `#${hotspot.id}`;
    
    // 显示面板
    this.panel.classList.add('show');
  }

  /**
   * 隐藏面板
   */
  hidePanel() {
    this.panel.classList.remove('show');
  }

  /**
   * 复制坐标
   */
  copyCoordinates() {
    if (!this.currentHotspot) return;
    
    const text = `区域 #${this.currentHotspot.id}
中心坐标: ${this.currentHotspot.lat.toFixed(6)}°, ${this.currentHotspot.lon.toFixed(6)}°
纬度范围: ${this.currentHotspot.latRange.min.toFixed(2)}° ~ ${this.currentHotspot.latRange.max.toFixed(2)}°
经度范围: ${this.currentHotspot.lonRange.min.toFixed(2)}° ~ ${this.currentHotspot.lonRange.max.toFixed(2)}°`;
    
    navigator.clipboard.writeText(text).then(() => {
      this.showMessage('✅ 坐标已复制到剪贴板', 'success');
    }).catch(() => {
      this.showMessage('❌ 复制失败', 'error');
    });
  }

  /**
   * 保存热点信息到后端
   */
  async saveHotspot() {
    if (!this.currentHotspot) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/earth/save-hotspot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(this.currentHotspot)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showMessage('✅ 区域信息已保存', 'success');
      } else {
        this.showMessage('❌ 保存失败: ' + result.message, 'error');
      }
    } catch (error) {
      console.error('保存失败:', error);
      this.showMessage('❌ 保存失败，请重试', 'error');
    }
  }

  /**
   * 更新统计信息
   */
  updateStatistics(stats) {
    document.getElementById('total-hotspots').textContent = stats.totalHotspots.toLocaleString();
  }

  /**
   * 显示消息提示
   */
  showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = 'earth-hint';
    message.style.background = type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
    message.textContent = text;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.style.opacity = '0';
      setTimeout(() => message.remove(), 500);
    }, 3000);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EarthHotspotsUI;
}
