import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Scene 场景类 - 管理Three.js场景、渲染器、相机等核心组件
 * @class Scene
 */
export default class Scene {
    /**
     * 构造函数 - 初始化3D场景
     * @param {HTMLCanvasElement} canvas - Canvas元素
     */
    constructor(canvas) {
        console.log('调用的地方')
        this.init(canvas);
        this.initGrid();
        this.beginRequestAnimationFrame();
        const self = this;
        // setTimeout(function () {
        //   self.stopRequestAnimationFrame();
        // }, 5000);
    }
    
    /**
     * 初始化网格辅助线
     * @method initGrid
     */
    initGrid() {
        const size = 1000; // 网格大小
        const divisions = 1000; // 网格分割数
        const gridHelper = new THREE.GridHelper(size, divisions);
        this.Scene.add(gridHelper);
    }
    
    /**
     * 初始化场景核心组件
     * @method init
     * @param {HTMLCanvasElement} canvas - Canvas元素
     */
    init(canvas) {
        // 创建WebGL渲染器
        const renderer = new THREE.WebGLRenderer({
            canvas
        });
        this.WebGLRenderer = renderer;

        // 创建透视相机
        const fov = 75; // 视野角度
        const aspect = 2; // 宽高比（默认值）
        const near = 0.1; // 近裁剪面
        const far = 300000; // 远裁剪面
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.z = 2;
        this.PerspectiveCamera = camera;
        
        // 创建场景
        const scene = new THREE.Scene();
        this.Scene = scene;
        console.log(this.Scene)
        scene.add(camera);
        
        // 添加方向光源
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
        this.DirectionalLight = light;

        // 创建轨道控制器（允许鼠标交互）
        var controls = new OrbitControls(camera, renderer.domElement);

        // 设置场景背景和雾效
        scene.background = new THREE.Color(0xa0a0a0);
        scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);


    }

    /**
     * 开始动画循环
     * @method beginRequestAnimationFrame
     */
    /**
     * 开始动画循环
     * @method beginRequestAnimationFrame
     */
    beginRequestAnimationFrame() {
        const self = this;
        const render = function(time) {
            self.render(time);
            self.RequestAnimationFrame = requestAnimationFrame(render);
        };
        self.RequestAnimationFrame = requestAnimationFrame(render);
    }

    /**
     * 停止动画循环
     * @method stopRequestAnimationFrame
     */
    stopRequestAnimationFrame() {
        cancelAnimationFrame(this.RequestAnimationFrame);
        const self = this;
        const render = function() {
            requestAnimationFrame(render);
            self.WebGLRenderer.render(self.Scene, self.PerspectiveCamera);
        };
        requestAnimationFrame(render);
    }

    /**
     * 渲染函数 - 每帧调用
     * @method render
     * @param {number} time - 当前时间戳（毫秒）
     */
    render(time) {
        let camera = this.PerspectiveCamera;
        let scene = this.Scene;
        let renderer = this.WebGLRenderer;

        time *= 0.001; // 转换为秒

        // 响应式调整渲染器大小
        if (this.resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
    }

    /**
     * 创建网格实例
     * @method makeInstance
     * @param {THREE.Geometry} geometry - 几何体
     * @param {number} color - 颜色
     * @param {number} x - X轴位置
     * @returns {THREE.Mesh} 网格对象
     */
    /**
     * 创建网格实例
     * @method makeInstance
     * @param {THREE.Geometry} geometry - 几何体
     * @param {number} color - 颜色
     * @param {number} x - X轴位置
     * @returns {THREE.Mesh} 网格对象
     */
    makeInstance(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({
            color
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;
        cube.xOffset = 0.02;
        cube.yOffset = 0.02;
        return cube;
    }

    /**
     * 检查并调整渲染器大小以适应显示区域
     * @method resizeRendererToDisplaySize
     * @param {THREE.WebGLRenderer} renderer - 渲染器
     * @returns {boolean} 是否需要调整大小
     */
    resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }
}