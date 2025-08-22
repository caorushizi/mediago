# MediaGo 架构优化建议

## 项目现状分析

MediaGo 是一个基于 Electron 的视频下载器，采用 monorepo 架构，包含以下模块：

- **main**: Electron 主进程
- **renderer**: React 前端（Electron 渲染进程）
- **backend**: Node.js 后端服务
- **shared**: 共享代码库
- **plugin**: 浏览器插件
- **mobile**: 移动端应用

## 核心架构优化建议

### 1. 🔧 代码重复优化

**问题**: 在多个包中发现重复的工具函数
```typescript
// 在 main/src/helper/index.ts 和 backend/src/helper/index.ts 中都有：
export async function sleep(second = 1): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, second * 1000));
}
```

**解决方案**: 统一迁移到 shared 包
```typescript
// packages/shared/src/common/utils.ts
export class CommonUtils {
  static async sleep(seconds = 1): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  static formatHeaders(headers: Record<string, string>): string {
    if (!headers) return "";
    return Object.entries(headers)
      .map(([key, value]) => `${key}:${value}`)
      .join("\n");
  }

  static success<T>(data: T): IpcResponse<T> {
    return { code: 0, message: "success", data };
  }

  static error(message = "fail"): IpcResponse<null> {
    return { code: -1, message, data: null };
  }
}
```

### 2. 🏗️ 构建系统现代化

**问题**: 当前使用 Gulp + esbuild，配置复杂且构建速度慢

**解决方案**: 迁移到 Turborepo + Vite/Rollup
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

### 3. 📦 依赖注入容器优化

**问题**: Inversify 配置分散，类型安全性不足

**解决方案**: 创建类型安全的 DI 容器
```typescript
// packages/shared/src/common/di/types.ts
export const TYPES = {
  // Services
  TaskQueueService: Symbol.for('TaskQueueService'),
  DownloaderService: Symbol.for('DownloaderService'),
  
  // Repositories
  VideoRepository: Symbol.for('VideoRepository'),
  FavoriteRepository: Symbol.for('FavoriteRepository'),
  
  // Infrastructure
  Logger: Symbol.for('Logger'),
  Database: Symbol.for('Database'),
} as const;

// packages/shared/src/common/di/container.ts
export class DIContainer {
  private static instance: Container;
  
  static getInstance(): Container {
    if (!this.instance) {
      this.instance = new Container({
        skipBaseClassChecks: true,
        defaultScope: 'Singleton',
        autoBindInjectable: true,
      });
      this.configureBindings();
    }
    return this.instance;
  }
  
  private static configureBindings(): void {
    // 集中配置所有绑定
  }
}
```

### 4. 🔄 状态管理优化

**问题**: React 组件中状态管理分散，使用多个 Zustand store

**解决方案**: 统一状态管理架构
```typescript
// packages/renderer/src/store/index.ts
export interface RootState {
  app: AppState;
  download: DownloadState;
  browser: BrowserState;
  session: SessionState;
}

export const useStore = create<RootState>()(
  devtools(
    persist(
      (set, get) => ({
        app: createAppSlice(set, get),
        download: createDownloadSlice(set, get),
        browser: createBrowserSlice(set, get),
        session: createSessionSlice(set, get),
      }),
      {
        name: 'mediago-store',
        partialize: (state) => ({
          app: state.app,
          session: state.session,
        }),
      }
    )
  )
);

// 类型安全的选择器
export const useAppState = () => useStore((state) => state.app);
export const useDownloadState = () => useStore((state) => state.download);
```

### 5. 🚨 错误处理标准化

**问题**: 错误处理不一致，缺乏统一的错误边界

**解决方案**: 实现统一错误处理系统
```typescript
// packages/shared/src/common/errors/index.ts
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class DownloadError extends AppError {
  readonly code = 'DOWNLOAD_ERROR';
  readonly statusCode = 500;
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

// 错误处理中间件
export class ErrorHandler {
  static handle(error: unknown): IpcResponse<null> {
    if (error instanceof AppError) {
      return CommonUtils.error(error.message);
    }
    
    // 记录未知错误
    console.error('Unknown error:', error);
    return CommonUtils.error('Internal server error');
  }
}
```

### 6. 📡 IPC 通信优化

**问题**: IPC 通信缺乏类型安全，事件处理分散

**解决方案**: 类型安全的 IPC 系统
```typescript
// packages/shared/src/common/ipc/types.ts
export interface IpcChannels {
  'get-videos': {
    request: { page: number; limit: number };
    response: Video[];
  };
  'download-video': {
    request: { url: string; quality: string };
    response: { taskId: number };
  };
  'get-download-progress': {
    request: { taskId: number };
    response: { progress: number; status: DownloadStatus };
  };
}

// packages/main/src/ipc/handler.ts
export class TypedIpcHandler {
  @handle('get-videos')
  async getVideos(
    event: IpcMainInvokeEvent,
    params: IpcChannels['get-videos']['request']
  ): Promise<IpcChannels['get-videos']['response']> {
    // 实现逻辑
  }
  
  @handle('download-video')
  async downloadVideo(
    event: IpcMainInvokeEvent,
    params: IpcChannels['download-video']['request']
  ): Promise<IpcChannels['download-video']['response']> {
    // 实现逻辑
  }
}
```

### 7. 🧪 测试基础设施

**问题**: 项目缺乏测试基础设施

**解决方案**: 建立完整的测试体系
```typescript
// packages/shared/src/testing/setup.ts
export class TestSetup {
  static setupDatabase(): DataSource {
    return new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Video, Favorite, Conversion],
      synchronize: true,
    });
  }
  
  static createMockContainer(): Container {
    const container = new Container();
    // 配置 mock 依赖
    return container;
  }
}

// packages/main/src/__tests__/services/DownloaderService.test.ts
describe('DownloaderService', () => {
  let service: DownloaderService;
  let container: Container;
  
  beforeEach(() => {
    container = TestSetup.createMockContainer();
    service = container.get<DownloaderService>(TYPES.DownloaderService);
  });
  
  it('should download video successfully', async () => {
    // 测试逻辑
  });
});
```

### 8. 📊 性能监控

**解决方案**: 添加性能监控系统
```typescript
// packages/shared/src/common/performance/index.ts
export class PerformanceMonitor {
  private static metrics = new Map<string, number>();
  
  static startTimer(name: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.metrics.set(name, duration);
      return duration;
    };
  }
  
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const stopTimer = this.startTimer(name);
    try {
      const result = await fn();
      const duration = stopTimer();
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      stopTimer();
      throw error;
    }
  }
  
  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}
```

### 9. 🔒 类型安全强化

**解决方案**: 更严格的 TypeScript 配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["packages/*/src/**/*"],
  "exclude": ["node_modules", "**/dist/**", "**/build/**"]
}
```

### 10. 📈 代码质量工具

**解决方案**: 完善的代码质量检查
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "plugin:security/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/explicit-function-return-type": "error"
  }
}
```

## 实施优先级

### 高优先级（立即实施）
1. **代码重复消除**: 迁移共用工具函数到 shared 包
2. **错误处理标准化**: 实现统一错误处理机制
3. **类型安全强化**: 更新 TypeScript 配置

### 中优先级（2-4周内）
1. **状态管理优化**: 重构 Zustand store 结构
2. **IPC 通信优化**: 实现类型安全的 IPC 系统
3. **依赖注入优化**: 重构 Inversify 配置

### 低优先级（长期规划）
1. **构建系统现代化**: 迁移到 Turborepo
2. **测试基础设施**: 建立完整测试体系
3. **性能监控**: 添加性能监控系统

## 预期收益

- **开发效率**: 提升 30-40%
- **代码质量**: 减少 50% 的运行时错误
- **构建速度**: 提升 20-30%
- **维护成本**: 降低 40%
- **团队协作**: 改善代码一致性和可读性