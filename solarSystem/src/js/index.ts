import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import TWEEN from "@tweenjs/tween.js";
import EarthHotspots from './EarthHotspots';
import EarthHotspotsUI from './EarthHotspotsUI';

// 将TWEEN添加到全局对象
(window as any).TWEEN = TWEEN;

// GLSL Shaders (保持原样)
const _VSAroud = /* glsl */`
    varying vec2 vUv;
    uniform float Time;
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform samplerCube uPerlin;
    varying vec3 vLayer0;
    varying vec3 vLayer1;
    varying vec3 vLayer2;
    varying vec3 eyeVector;
    varying vec3  vVertexWorldPosition;
    uniform float coeficient;
    uniform vec3  glowColor;
    mat2 rotate(float a) {
        float s = sin(a);
        float c = cos(a);
        return mat2(c,-s,s,c);
    }
    void main() {
        vec4 worldPosition=modelMatrix * vec4(position,1.0);
        eyeVector = normalize(worldPosition.xyz - cameraPosition);
        float t = Time * 0.1;
        mat2 rot=rotate(t);
        vec3 p0 = position;
        p0.yz=rot*p0.yz;
        vLayer0 = p0;
        mat2 rot1 = rotate(t + 10.);
        vec3 p1 = position;
        p1.xz=rot1*p1.xz;
        vLayer1 = p1;
        mat2 rot2 = rotate(t + 40.);
        vec3 p2 = position;
        p2.xy = rot2*p2.xy;
        vLayer2 = p2;
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
`;

const _FSAroud = /* glsl */`
    varying vec2 vUv;
    uniform float Time;
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform samplerCube uPerlin;
    varying vec3 vLayer0;
    varying vec3 vLayer1;
    varying vec3 vLayer2;
    varying vec3 eyeVector;
    vec3 brightnessToColor(float b){
        b *=0.25;
        return (vec3(b,b*b,b*b*b*b)/0.2)*0.6;
    }
    float Fresnel(vec3 eyeVector,vec3 worldNormal) {
        return pow(1.0 + dot(eyeVector,worldNormal),3.0);
    }
    float supersum(){
        float sum=0.;
        sum += textureCube(uPerlin,vLayer0).r;
        sum += textureCube(uPerlin,vLayer1).r;
        sum += textureCube(uPerlin,vLayer2).r;
        sum *=0.3;
        return sum;
    }
    void main() {
        float brightness = supersum();
        brightness = brightness * 4. + 1.;
        float fres= Fresnel(eyeVector,vNormal);
        brightness +=pow(fres,0.1);
        vec3 col = brightnessToColor(brightness);
        float intensity = pow(0.5 - dot(vNormal,vec3(0,0,1.0)),2.0);
        gl_FragColor = vec4(col,1.0) * intensity;
    }
`;

// 应用初始化
interface SceneState {
  controls: OrbitControls | null;
  directionalLight: THREE.DirectionalLight | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  starArray: THREE.Mesh[];
  earthMesh: THREE.Mesh | null;
  earthHotspots: any;
  earthHotspotsUI: any;
  clock: THREE.Clock;
  name: string;
  isZoomedIn: boolean;
}

const state: SceneState = {
  controls: null,
  directionalLight: null,
  camera: null,
  renderer: null,
  scene: null,
  starArray: [],
  earthMesh: null,
  earthHotspots: null,
  earthHotspotsUI: null,
  clock: new THREE.Clock(),
  name: 'Sum',
  isZoomedIn: false
};

// 初始化函数
function initThree(): void {
  const canvas = document.getElementById('sceneCanvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.outputEncoding = THREE.sRGBEncoding;
  canvas.appendChild(renderer.domElement);

  state.renderer = renderer;

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
  camera.position.set(0, 0, 100);
  state.camera = camera;

  const controls = new OrbitControls(camera, renderer.domElement);
  state.controls = controls;

  const scene = new THREE.Scene();
  state.scene = scene;

  // 加载天空盒
  loadSkybox(scene);

  // 初始化灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // 初始化行星
  initPlanets();
  initSun();

  // 开始动画循环
  animate();
}

function loadSkybox(scene: THREE.Scene): void {
  const urls = genCubeUrls('../Resources/贴图/MilkyWay/', '.jpg');
  new THREE.CubeTextureLoader().load(urls, (cubeTexture: THREE.CubeTexture) => {
    cubeTexture.encoding = THREE.sRGBEncoding;
    scene.background = cubeTexture;
  });
}

function genCubeUrls(prefix: string, postfix: string): string[] {
  return [
    prefix + 'px' + postfix,
    prefix + 'nx' + postfix,
    prefix + 'py' + postfix,
    prefix + 'ny' + postfix,
    prefix + 'pz' + postfix,
    prefix + 'nz' + postfix
  ];
}

function initPlanets(): void {
  // 初始化所有行星
  initMercury();
  initVenus();
  initEarth();
  initMars();
  initJupiter();
  initSaturn();
  initUranus();
  initNeptune();
}

function initMercury(): void {
  createPlanet('水星', 30, 1, '../Resources/贴图/星球/mercury.JPG');
}

function initVenus(): void {
  createPlanet('金星', 45, 2, '../Resources/贴图/星球/venus_surface.JPG');
}

function initEarth(): void {
  const mesh = createPlanet('地球', 60, 2.5, '../Resources/贴图/星球/earth.JPG');
  state.earthMesh = mesh;
  
  // 延迟初始化热点系统
  setTimeout(() => {
    initEarthHotspots();
  }, 100);
}

function initMars(): void {
  createPlanet('火星', 80, 3, '../Resources/贴图/星球/mars.JPG');
}

function initJupiter(): void {
  createPlanet('木星', 100, 6, '../Resources/贴图/星球/jupiter.JPG');
}

function initSaturn(): void {
  createPlanet('土星', 120, 6.2, '../Resources/贴图/星球/saturn.JPG');
}

function initUranus(): void {
  createPlanet('天王星', 140, 3.5, '../Resources/贴图/星球/uranus.JPG');
}

function initNeptune(): void {
  createPlanet('海王星', 160, 3.5, '../Resources/贴图/星球/neptune.JPG');
}

function createPlanet(name: string, orbitRadius: number, scale: number, textureUrl: string): THREE.Mesh {
  if (!state.scene) return null as any;

  // 创建轨道线
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const geometry = new THREE.CircleGeometry(orbitRadius, 4096);
  const vertices = geometry.vertices;
  vertices.shift(); // 移除中心顶点
  
  const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(vertices), material);
  state.scene.add(line);

  // 创建行星
  const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
  sphereMaterial.map = new THREE.TextureLoader().load(textureUrl);
  
  const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  mesh.name = name;
  mesh.scale.set(scale, scale, scale);
  
  // 初始化位置
  const index = randomNum(0, vertices.length - 1);
  (mesh as any).userData = { data: vertices, index };
  mesh.position.copy(vertices[index]);
  
  state.starArray.push(mesh);
  state.scene.add(mesh);

  return mesh;
}

function initSun(): void {
  if (!state.scene) return;

  const geometry = new THREE.SphereBufferGeometry(20, 210, 210);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      Time: { value: 0 },
      uPerlin: { value: null }
    },
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(1.0, 0.8, 0.2, 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'Sum';
  state.scene.add(mesh);
}

function randomNum(minNum: number, maxNum: number): number {
  return parseInt(String(Math.random() * (maxNum - minNum + 1) + minNum), 10);
}

function initEarthHotspots(): void {
  if (!state.earthMesh || !state.renderer) {
    console.error('地球网格或渲染器未初始化');
    return;
  }

  try {
    state.earthHotspotsUI = new EarthHotspotsUI();
    state.earthHotspots = new EarthHotspots(
      state.earthMesh,
      state.camera,
      state.renderer,
      state.earthHotspotsUI
    );
  } catch (error) {
    console.error('初始化地球热点系统失败:', error);
  }
}

function animate(): void {
  TWEEN.update();
  updateStars();
  updatePositions();

  if (state.earthHotspots) {
    state.earthHotspots.update();
  }

  if (state.renderer && state.scene && state.camera) {
    state.renderer.render(state.scene, state.camera);
  }

  requestAnimationFrame(animate);
}

function updateStars(): void {
  state.starArray.forEach((item) => {
    item.rotateZ(0.001);
  });
}

function updatePositions(): void {
  const time = state.clock.getDelta();
  let t1 = 0;

  t1 += time;
  if (t1 * 1000 > 50) {
    t1 = time;
    state.starArray.forEach((item) => {
      const userData = (item as any).userData;
      if (userData.index >= userData.data.length - 1) {
        userData.index = 0;
      }
      item.position.copy(userData.data[userData.index]);
      userData.index += 1;
    });
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  initThree();
});

export { state };
