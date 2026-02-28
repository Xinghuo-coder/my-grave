# TypeScript 快速参考

## 📝 快速命令速查表

```bash
# 启动开发
npm start                   # 同时启动前后端（推荐）
npm run dev                 # 仅启动前端
npm run server:dev          # 仅启动后端

# 检查和格式化
npm run lint                # 代码检查
npm run format              # 格式化代码
npm run type-check          # 类型检查

# 构建生产
npm run build               # 构建项目
```

## 🎯 TypeScript 基础用法

### 基本类型
```typescript
// 基础类型
let count: number = 0;
let name: string = "Solar System";
let isActive: boolean = true;
let data: any = "any type";

// 数组类型
let numbers: number[] = [1, 2, 3];
let items: Array<string> = ["a", "b"];

// 联合类型
let status: "active" | "inactive" | "pending" = "active";

// 可选类型
let optional?: string;
let nullable: string | null = null;
```

### 接口定义
```typescript
interface Planet {
  name: string;
  radius: number;
  distance: number;
}

const earth: Planet = {
  name: "Earth",
  radius: 6371,
  distance: 149600000
};
```

### 类和继承
```typescript
class CelestialBody {
  protected name: string;
  private radius: number;

  constructor(name: string, radius: number) {
    this.name = name;
    this.radius = radius;
  }

  public getName(): string {
    return this.name;
  }
}

class Planet extends CelestialBody {
  private distanceFromSun: number;

  constructor(name: string, radius: number, distance: number) {
    super(name, radius);
    this.distanceFromSun = distance;
  }
}
```

### 泛型
```typescript
// 泛型函数
function createArray<T>(value: T, count: number): T[] {
  return new Array(count).fill(value);
}

const nums = createArray<number>(5, 3);  // [5, 5, 5]

// 泛型类
class Container<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getItems(): T[] {
    return this.items;
  }
}
```

## 📦 项目中的常见模式

### API 响应类型
```typescript
import type { ApiResponse } from './server/types';

// 使用
const response: ApiResponse<UserData> = {
  success: true,
  status: 200,
  message: "Success",
  data: { /* ... */ },
  timestamp: new Date().toISOString()
};
```

### 场景初始化
```typescript
class Scene {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;

  constructor(canvas: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(...);
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.scene = new THREE.Scene();
  }
}
```

### 错误处理
```typescript
async function fetchData(): Promise<void> {
  try {
    const response: ApiResponse = await fetch('/api/data');
    if (!response.success) {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 🔧 IDE 快捷键

| 功能 | 快捷键 |
|------|--------|
| 查看类型 | Hover on variable |
| 转到定义 | F12 或 Cmd+Click |
| 重命名 | F2 |
| 快速修复 | Cmd+. |
| 格式化 | Shift+Option+F |
| 自动导入 | Cmd+Shift+P > "organize imports" |

## ⚠️ 常见错误和解决方案

### Error: Type 'any' is implicitly assigned
```typescript
// ❌ 错误
function process(data) { }

// ✅ 正确
function process(data: unknown): void { }
```

### Error: Cannot find name 'document'
```typescript
// 添加到 tsconfig.json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

### Property does not exist on type
```typescript
// ❌ 错误
const element = document.querySelector('#app');
element.innerHTML = "test";  // 可能为 null

// ✅ 正确
const element = document.querySelector('#app');
if (element) {
  element.innerHTML = "test";
}
```

## 📚 学习资源

- [TypeScript 官方手册](https://www.typescriptlang.org/docs/)
- [TypeScript 官方示例](https://www.typescriptlang.org/play)
- [TypeScript Cheatsheet](https://devhints.io/typescript)

## 🎓 进阶主题

### 装饰器
```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, args);
    return originalMethod.apply(this, args);
  };
}

class Example {
  @Log
  myMethod(x: number): number {
    return x * 2;
  }
}
```

### 条件类型
```typescript
type IsString<T> = T extends string ? true : false;
type A = IsString<"hello">;  // true
type B = IsString<123>;      // false
```

### 映射类型
```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

interface User {
  name: string;
  age: number;
}

type ReadonlyUser = Readonly<User>;
```

---

**需要更多帮助？** 查看 [TYPESCRIPT_MIGRATION_GUIDE.md](./TYPESCRIPT_MIGRATION_GUIDE.md)
