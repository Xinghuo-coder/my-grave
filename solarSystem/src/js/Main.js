import Scene from './Scene.js'

/**
 * Main 主类 - 太阳系应用的入口点
 * @class Main
 */
class Main {
    /**
     * 构造函数 - 初始化应用
     * @constructor
     */
    constructor() {
        const cavasId = '#sceneCanvas';
        // 获取canvas元素
        let canvas = document.querySelector(cavasId);
        this.init(canvas);
    }

    /**
     * 初始化场景
     * @param {HTMLCanvasElement} canvas - Canvas元素
     */
    init(canvas) {
        // 创建3D场景实例
        this.Scene = new Scene(canvas);
        console.log(this.Scene)
    }
}
export default Main;