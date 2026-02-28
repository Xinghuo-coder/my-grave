import Scene from './Scene';

/**
 * Main 主类 - 太阳系应用的入口点
 */
export default class Main {
    private scene: Scene | undefined;

    /**
     * 构造函数 - 初始化应用
     */
    constructor() {
        const canvasId = '#sceneCanvas';
        const canvas = document.querySelector(canvasId) as HTMLCanvasElement;
        
        if (canvas) {
            this.init(canvas);
        } else {
            console.error(`Canvas element not found: ${canvasId}`);
        }
    }

    /**
     * 初始化场景
     */
    private init(canvas: HTMLCanvasElement): void {
        // 创建3D场景实例
        this.scene = new Scene(canvas);
        console.log('Main scene initialized', this.scene);
    }

    /**
     * 获取场景实例
     */
    public getScene(): Scene | undefined {
        return this.scene;
    }
}
