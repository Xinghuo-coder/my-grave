/**
 * 太阳系行星配置文件
 * @module planetsConfig
 */

/**
 * 行星配置数据
 * @typedef {Object} PlanetConfig
 * @property {string} name - 行星名称
 * @property {number} orbitRadius - 轨道半径
 * @property {number} size - 行星大小（缩放比例）
 * @property {string} texture - 纹理贴图路径
 * @property {number} orbitSpeed - 公转速度系数
 * @property {number} rotationSpeed - 自转速度
 * @property {string} color - 行星主色调（十六进制）
 * @property {number} segments - 轨道分段数（影响轨道平滑度）
 */

/**
 * 太阳配置
 * @type {Object}
 */
export const sunConfig = {
  name: '太阳',
  radius: 20, // 半径
  color: 0xFFCC00,
  texture: '../Resources/贴图/星球/sun.jpg',
  glowRadius: 22, // 光晕半径
  glowColor: 0xFFAA00
};

/**
 * 行星配置列表
 * @type {PlanetConfig[]}
 */
export const planetsConfig = [
  {
    name: '水星',
    orbitRadius: 30,
    size: 1,
    texture: '../Resources/贴图/星球/mercury.jpg',
    orbitSpeed: 1.6,
    rotationSpeed: 0.001,
    color: 0x8C7853,
    segments: 1024
  },
  {
    name: '金星',
    orbitRadius: 45,
    size: 2,
    texture: '../Resources/贴图/星球/venus_surface.jpg',
    orbitSpeed: 1.2,
    rotationSpeed: 0.001,
    color: 0xFFC649,
    segments: 4096
  },
  {
    name: '地球',
    orbitRadius: 60,
    size: 2.5,
    texture: '../Resources/贴图/星球/earth.jpg',
    orbitSpeed: 1.0,
    rotationSpeed: 0.001,
    color: 0x4169E1,
    segments: 4096
  },
  {
    name: '火星',
    orbitRadius: 80,
    size: 3,
    texture: '../Resources/贴图/星球/mars.jpg',
    orbitSpeed: 0.8,
    rotationSpeed: 0.001,
    color: 0xCD5C5C,
    segments: 4096
  },
  {
    name: '木星',
    orbitRadius: 100,
    size: 6,
    texture: '../Resources/贴图/星球/jupiter.jpg',
    orbitSpeed: 0.4,
    rotationSpeed: 0.001,
    color: 0xDAA520,
    segments: 4096
  },
  {
    name: '土星',
    orbitRadius: 120,
    size: 6.2,
    texture: '../Resources/贴图/星球/saturn.jpg',
    orbitSpeed: 0.3,
    rotationSpeed: 0.001,
    color: 0xF4A460,
    segments: 4096
  },
  {
    name: '天王星',
    orbitRadius: 140,
    size: 3.5,
    texture: '../Resources/贴图/星球/uranus.jpg',
    orbitSpeed: 0.2,
    rotationSpeed: 0.001,
    color: 0x4FD0E0,
    segments: 4096
  },
  {
    name: '海王星',
    orbitRadius: 160,
    size: 3.5,
    texture: '../Resources/贴图/星球/neptune.jpg',
    orbitSpeed: 0.1,
    rotationSpeed: 0.001,
    color: 0x4169E1,
    segments: 4096
  }
];

/**
 * 场景配置
 * @type {Object}
 */
export const sceneConfig = {
  // 相机配置
  camera: {
    fov: 35,
    near: 0.1,
    far: 1000,
    initialPosition: { x: 0, y: 0, z: 100 }
  },
  // 光源配置
  lighting: {
    ambient: {
      color: 0xffffff,
      intensity: 1
    }
  },
  // 动画配置
  animation: {
    updateInterval: 50, // 位置更新间隔（毫秒）
  }
};

/**
 * Shader配置
 * @type {Object}
 */
export const shaderConfig = {
  sun: {
    timeScale: 0.002, // 时间缩放因子
    noiseScale: 4.0,  // 噪声缩放
  },
  atmosphere: {
    timeScale: 0.002,
    opacity: 0.8,
    glowIntensity: 0.0001
  }
};
