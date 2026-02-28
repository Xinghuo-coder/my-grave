import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Scene 场景类 - 管理Three.js场景、渲染器、相机等核心组件
 */
export default class Scene {
    private canvas: HTMLCanvasElement;
    private WebGLRenderer: THREE.WebGLRenderer | undefined;
    private PerspectiveCamera: THREE.PerspectiveCamera | undefined;
    private Scene: THREE.Scene | undefined;
    private DirectionalLight: THREE.DirectionalLight | undefined;
    private RequestAnimationFrame: number | undefined;
    private controls: OrbitControls | undefined;

    /**
     * 构造函数 - 初始化3D场景
     */
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        console.log('Scene initialized');
        this.init(canvas);
        this.initGrid();
        this.beginRequestAnimationFrame();
    }

    /**
     * 初始化网格辅助线
     */
    private initGrid(): void {
        const size = 1000;
        const divisions = 1000;
        const gridHelper = new THREE.GridHelper(size, divisions);
        if (this.Scene) {
            this.Scene.add(gridHelper);
        }
    }

    /**
     * 初始化场景核心组件
     */
    private init(canvas: HTMLCanvasElement): void {
        // 创建WebGL渲染器
        const renderer = new THREE.WebGLRenderer({ canvas });
        this.WebGLRenderer = renderer;

        // 创建透视相机
        const fov = 75;
        const aspect = 2;
        const near = 0.1;
        const far = 300000;
        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.z = 2;
        this.PerspectiveCamera = camera;

        // 创建场景
        const scene = new THREE.Scene();
        this.Scene = scene;
        scene.add(camera);

        // 添加方向光源
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
        this.DirectionalLight = light;

        // 创建轨道控制器（允许鼠标交互）
        this.controls = new OrbitControls(camera, renderer.domElement);

        // 设置场景背景和雾效
        scene.background = new THREE.Color(0xa0a0a0);
        scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);
    }

    /**
     * 开始动画循环
     */
    private beginRequestAnimationFrame(): void {
        const render = (time: number): void => {
            this.render(time);
            this.RequestAnimationFrame = requestAnimationFrame(render);
        };
        this.RequestAnimationFrame = requestAnimationFrame(render);
    }

    /**
     * 停止动画循环
     */
    public stopRequestAnimationFrame(): void {
        if (this.RequestAnimationFrame) {
            cancelAnimationFrame(this.RequestAnimationFrame);
        }
        const render = (): void => {
            requestAnimationFrame(render);
            if (this.WebGLRenderer && this.Scene && this.PerspectiveCamera) {
                this.WebGLRenderer.render(this.Scene, this.PerspectiveCamera);
            }
        };
        requestAnimationFrame(render);
    }

    /**
     * 渲染函数 - 每帧调用
     */
    private render(time: number): void {
        if (!this.PerspectiveCamera || !this.Scene || !this.WebGLRenderer) {
            return;
        }

        const camera = this.PerspectiveCamera;
        const scene = this.Scene;
        const renderer = this.WebGLRenderer;

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
     */
    public makeInstance(
        geometry: THREE.BufferGeometry,
        color: number,
        x: number
    ): THREE.Mesh {
        const material = new THREE.MeshPhongMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = x;
        return cube;
    }

    /**
     * 检查并调整渲染器大小以适应显示区域
     */
    private resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer): boolean {
        const canvas = renderer.domElement as HTMLCanvasElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    /**
     * 获取场景实例
     */
    public getScene(): THREE.Scene | undefined {
        return this.Scene;
    }

    /**
     * 获取相机实例
     */
    public getCamera(): THREE.PerspectiveCamera | undefined {
        return this.PerspectiveCamera;
    }

    /**
     * 获取渲染器实例
     */
    public getRenderer(): THREE.WebGLRenderer | undefined {
        return this.WebGLRenderer;
    }
}
