# MediaGo 架构优化实施指南

本文档提供了具体的代码重构步骤和实施建议，帮助团队逐步优化 MediaGo 项目架构。

## 🚀 快速开始

### 第一阶段：基础架构优化（1-2周）

#### 1. 创建共享工具类

**位置**: `packages/shared/src/common/utils/CommonUtils.ts`

**实施步骤**:
```bash
# 1. 创建目录结构
mkdir -p packages/shared/src/common/utils
mkdir -p packages/shared/src/common/errors
mkdir -p packages/shared/src/common/performance
mkdir -p packages/shared/src/common/ipc

# 2. 复制优化文件
cp examples/CommonUtils.ts packages/shared/src/common/utils/
cp examples/ErrorHandler.ts packages/shared/src/common/errors/
cp examples/PerformanceMonitor.ts packages/shared/src/common/performance/
cp examples/types.ts packages/shared/src/common/ipc/
```

#### 2. 更新现有代码以使用共享工具

**在 main/src/helper/index.ts 中**:
```typescript
// 删除重复的函数
// export async function sleep(second = 1): Promise<void> { ... }
// export function formatHeaders(headers: Record<string, string>): string { ... }

// 导入共享工具
import { CommonUtils } from '@mediago/shared/common';

// 使用共享工具
export const sleep = CommonUtils.sleep;
export const formatHeaders = CommonUtils.formatHeaders;
export const getLocalIP = CommonUtils.getLocalIP;
```

**在 backend/src/helper/index.ts 中**:
```typescript
// 同样删除重复函数并导入共享工具
import { CommonUtils, ErrorHandler } from '@mediago/shared/common';

export const sleep = CommonUtils.sleep;
export const formatHeaders = CommonUtils.formatHeaders;
export const success = CommonUtils.success;
export const error = CommonUtils.error;
```

#### 3. 集成错误处理

**更新服务类示例**:
```typescript
import { ErrorHandler, HandleErrors, DownloadError } from '@mediago/shared/common';

export class DownloaderService {
  @HandleErrors
  async downloadVideo(url: string): Promise<void> {
    if (!this.isValidUrl(url)) {
      throw new DownloadError('Invalid URL provided', { url });
    }
    
    // 下载逻辑...
  }
  
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 第二阶段：性能监控集成（1周）

#### 1. 在关键服务中添加性能监控

**示例：在 TaskQueueService 中**:
```typescript
import { PerformanceMonitor, MonitorAsync } from '@mediago/shared/common';

export class TaskQueueService {
  @MonitorAsync('task-queue-add')
  async addTask(task: DownloadTask): Promise<number> {
    // 任务添加逻辑...
  }
  
  @MonitorAsync('task-queue-process')
  async processTask(taskId: number): Promise<void> {
    // 任务处理逻辑...
  }
  
  generateReport(): string {
    return PerformanceMonitor.generateReport();
  }
}
```

#### 2. 在 Electron 主进程中添加性能监控

**在 MainWindow 中**:
```typescript
import { PerformanceMonitor, MemoryMonitor } from '@mediago/shared/common';

export class MainWindow {
  // IPC 处理器中自动监控性能
  @IpcHandle('get-performance-report')
  async getPerformanceReport(): Promise<string> {
    return PerformanceMonitor.generateReport();
  }
  
  @IpcHandle('get-memory-usage')
  async getMemoryUsage() {
    return MemoryMonitor.getMemoryUsage();
  }
}
```

### 第三阶段：状态管理优化（2-3周）

#### 1. 重构 Zustand Store

**替换现有的 store 文件**:
```bash
# 备份现有文件
mv packages/renderer/src/store packages/renderer/src/store.backup

# 创建新的 store 结构
mkdir -p packages/renderer/src/store
cp examples/optimized-store.ts packages/renderer/src/store/index.ts
```

#### 2. 更新组件以使用新的 store

**在现有组件中**:
```typescript
// 旧的方式
const { setUpdateAvailable, setUploadChecking } = useSessionStore(
  useShallow(updateSelector),
);

// 新的方式
const { setLoading, setError } = useAppStore(state => ({
  setLoading: state.setLoading,
  setError: state.setError,
}));

// 或使用优化的选择器
const settings = useSettings();
const updateSettings = useUpdateSettings();
```

### 第四阶段：IPC 类型安全优化（2周）

#### 1. 实现类型安全的 IPC 系统

**在主进程中**:
```typescript
import { IpcHandle, IpcChannels } from '@mediago/shared/common';

export class MainWindowController {
  @IpcHandle('get-videos')
  async getVideos(
    request: IpcChannels['get-videos']['request']
  ): Promise<IpcChannels['get-videos']['response']> {
    return await this.videoRepository.getVideos(request);
  }
  
  @IpcHandle('download-video')
  async downloadVideo(
    request: IpcChannels['download-video']['request']
  ): Promise<IpcChannels['download-video']['response']> {
    // 实现逻辑
  }
}
```

**在渲染进程中**:
```typescript
import { IpcClient } from '@mediago/shared/common';

class ElectronIpcClient implements IpcClient {
  async invoke<K extends keyof IpcChannels>(
    channel: K,
    request: IpcChannels[K]['request']
  ): Promise<IpcChannels[K]['response']> {
    return window.electron.invoke(channel, request);
  }
  
  // 其他方法实现...
}
```

### 第五阶段：构建系统优化（长期）

#### 1. 迁移到 Turborepo

**添加 turbo.json**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    }
  }
}
```

**更新 package.json 脚本**:
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test"
  }
}
```

## 📊 效果评估

### 性能监控指标

实施后可通过以下方式监控改进效果：

```typescript
// 在任何地方获取性能报告
const report = PerformanceMonitor.generateReport();
console.log(report);

// 导出性能数据
const data = PerformanceMonitor.exportData();
fs.writeFileSync('performance-report.json', data);
```

### 内存使用监控

```typescript
// 定期监控内存使用
setInterval(() => {
  const usage = MemoryMonitor.getMemoryUsage();
  console.log('Memory Usage:', usage);
}, 30000); // 每30秒检查一次
```

## 🛠 开发工具配置

### 1. 更新 TypeScript 配置

```bash
cp examples/strict-tsconfig.json packages/main/tsconfig.json
cp examples/strict-tsconfig.json packages/renderer/tsconfig.json
cp examples/strict-tsconfig.json packages/backend/tsconfig.json
```

### 2. 添加 ESLint 规则

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### 3. 配置 VS Code 设置

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  }
}
```

## 🧪 测试策略

### 1. 单元测试示例

```typescript
// packages/shared/src/__tests__/utils/CommonUtils.test.ts
import { CommonUtils } from '../utils/CommonUtils';

describe('CommonUtils', () => {
  describe('sleep', () => {
    it('should delay execution for specified time', async () => {
      const start = Date.now();
      await CommonUtils.sleep(0.1); // 100ms
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThan(150);
    });
  });
  
  describe('formatHeaders', () => {
    it('should format headers correctly', () => {
      const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' };
      const result = CommonUtils.formatHeaders(headers);
      expect(result).toBe('Content-Type:application/json\nAuthorization:Bearer token');
    });
  });
});
```

### 2. 集成测试示例

```typescript
// packages/main/src/__tests__/windows/MainWindow.test.ts
import { Container } from 'inversify';
import { MainWindow } from '../../windows/MainWindow';
import { TestSetup } from '@mediago/shared/testing';

describe('MainWindow', () => {
  let container: Container;
  let mainWindow: MainWindow;
  
  beforeEach(() => {
    container = TestSetup.createMockContainer();
    mainWindow = container.get<MainWindow>(MainWindow);
  });
  
  afterEach(() => {
    mainWindow.destroy();
  });
  
  it('should handle download request', async () => {
    const request = {
      url: 'https://example.com/video.mp4',
      quality: 'best'
    };
    
    const response = await mainWindow.handleDownloadVideo(request);
    expect(response.taskId).toBeGreaterThan(0);
  });
});
```

## 📝 迁移检查清单

### 高优先级任务
- [ ] 创建共享工具类和错误处理系统
- [ ] 迁移重复代码到共享包
- [ ] 集成性能监控到关键服务
- [ ] 更新 TypeScript 配置为严格模式
- [ ] 重构主窗口类使用新架构

### 中优先级任务
- [ ] 重构 Zustand store 结构
- [ ] 实现类型安全的 IPC 系统
- [ ] 添加单元测试和集成测试
- [ ] 优化构建配置
- [ ] 添加代码质量检查工具

### 低优先级任务
- [ ] 迁移到 Turborepo
- [ ] 实现完整的测试覆盖
- [ ] 添加自动化性能测试
- [ ] 优化 CI/CD 流程
- [ ] 完善文档和开发指南

## 🔍 故障排除

### 常见问题

1. **导入路径错误**
   ```typescript
   // 错误
   import { CommonUtils } from '../../../shared/src/common/utils/CommonUtils';
   
   // 正确
   import { CommonUtils } from '@mediago/shared/common';
   ```

2. **类型错误**
   ```typescript
   // 确保在 tsconfig.json 中配置正确的路径映射
   "paths": {
     "@mediago/shared/common": ["../shared/src/common/index.ts"]
   }
   ```

3. **性能监控数据丢失**
   ```typescript
   // 在应用退出前保存性能数据
   process.on('beforeExit', () => {
     const data = PerformanceMonitor.exportData();
     fs.writeFileSync('performance-final-report.json', data);
   });
   ```

### 调试技巧

1. **使用 Store 调试工具**
   ```typescript
   const debug = useStoreDebug();
   debug.logState(); // 打印当前状态
   debug.exportState(); // 导出状态为 JSON
   ```

2. **性能问题诊断**
   ```typescript
   // 监控特定函数性能
   const monitoredFunction = PerformanceMonitor.monitorFunction('myFunction', originalFunction);
   ```

3. **错误追踪**
   ```typescript
   // 使用错误处理装饰器
   @HandleErrors
   async myMethod() {
     // 所有错误都会被自动处理和记录
   }
   ```

通过按照这个实施指南逐步进行，可以大幅提升 MediaGo 项目的代码质量、性能和可维护性。建议从高优先级任务开始，逐步推进整个优化过程。