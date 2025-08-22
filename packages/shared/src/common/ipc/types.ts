import type { DownloadItem, VideoResponse, ConversionResponse, ConversionPagination, DownloadItemPagination } from '../types';

/**
 * 类型安全的 IPC 通道定义
 */
export interface IpcChannels {
  // 视频相关
  'get-videos': {
    request: DownloadItemPagination;
    response: VideoResponse;
  };
  
  'add-video': {
    request: Omit<DownloadItem, 'id'>;
    response: DownloadItem;
  };
  
  'delete-video': {
    request: { id: number };
    response: void;
  };
  
  'download-video': {
    request: { 
      url: string; 
      quality?: string; 
      folder?: string;
      headers?: Record<string, string>;
    };
    response: { taskId: number };
  };
  
  'pause-download': {
    request: { taskId: number };
    response: void;
  };
  
  'resume-download': {
    request: { taskId: number };
    response: void;
  };
  
  'cancel-download': {
    request: { taskId: number };
    response: void;
  };
  
  // 转换相关
  'get-conversions': {
    request: ConversionPagination;
    response: ConversionResponse;
  };
  
  'add-conversion': {
    request: {
      inputPath: string;
      outputPath: string;
      format: string;
      quality?: string;
    };
    response: { conversionId: number };
  };
  
  'delete-conversion': {
    request: { id: number };
    response: void;
  };
  
  // 收藏夹相关
  'get-favorites': {
    request: void;
    response: Array<{
      id: number;
      url: string;
      title: string;
      createdAt: Date;
    }>;
  };
  
  'add-favorite': {
    request: {
      url: string;
      title: string;
    };
    response: {
      id: number;
      url: string;
      title: string;
      createdAt: Date;
    };
  };
  
  'remove-favorite': {
    request: { id: number };
    response: void;
  };
  
  // 设置相关
  'get-app-config': {
    request: void;
    response: {
      downloadPath: string;
      maxConcurrentDownloads: number;
      theme: 'light' | 'dark' | 'auto';
      language: string;
      proxy?: {
        enabled: boolean;
        host: string;
        port: number;
      };
    };
  };
  
  'update-app-config': {
    request: Partial<{
      downloadPath: string;
      maxConcurrentDownloads: number;
      theme: 'light' | 'dark' | 'auto';
      language: string;
      proxy?: {
        enabled: boolean;
        host: string;
        port: number;
      };
    }>;
    response: void;
  };
  
  // 系统相关
  'get-system-info': {
    request: void;
    response: {
      platform: string;
      arch: string;
      version: string;
      freeSpace: number;
      totalSpace: number;
    };
  };
  
  'show-item-in-folder': {
    request: { path: string };
    response: void;
  };
  
  'open-external': {
    request: { url: string };
    response: void;
  };
  
  // 窗口相关
  'minimize-window': {
    request: void;
    response: void;
  };
  
  'maximize-window': {
    request: void;
    response: void;
  };
  
  'close-window': {
    request: void;
    response: void;
  };
  
  'set-window-bounds': {
    request: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
    response: void;
  };
  
  // 更新相关
  'check-for-updates': {
    request: void;
    response: {
      hasUpdate: boolean;
      version?: string;
      releaseNotes?: string;
    };
  };
  
  'download-update': {
    request: void;
    response: void;
  };
  
  'install-update': {
    request: void;
    response: void;
  };
}

/**
 * IPC 事件定义
 */
export interface IpcEvents {
  // 下载事件
  'download-started': { taskId: number; url: string };
  'download-progress': { 
    taskId: number; 
    progress: number; 
    speed: number;
    remainingTime: number;
  };
  'download-completed': { taskId: number; filePath: string };
  'download-failed': { taskId: number; error: string };
  'download-paused': { taskId: number };
  'download-resumed': { taskId: number };
  'download-cancelled': { taskId: number };
  
  // 转换事件
  'conversion-started': { conversionId: number; inputPath: string };
  'conversion-progress': { conversionId: number; progress: number };
  'conversion-completed': { conversionId: number; outputPath: string };
  'conversion-failed': { conversionId: number; error: string };
  
  // 应用事件
  'app-config-changed': { config: Record<string, any> };
  'theme-changed': { theme: 'light' | 'dark' };
  'language-changed': { language: string };
  
  // 系统事件
  'window-blur': void;
  'window-focus': void;
  'window-minimize': void;
  'window-maximize': void;
  'window-restore': void;
  
  // 更新事件
  'update-available': { version: string; releaseNotes: string };
  'update-not-available': void;
  'update-downloaded': void;
  'update-error': { error: string };
  
  // 错误事件
  'error': { message: string; stack?: string };
  'warning': { message: string };
  'info': { message: string };
}

/**
 * 类型安全的 IPC 处理器基类
 */
export abstract class TypedIpcHandler {
  /**
   * 处理 IPC 调用
   */
  abstract handle<K extends keyof IpcChannels>(
    channel: K,
    request: IpcChannels[K]['request']
  ): Promise<IpcChannels[K]['response']>;
  
  /**
   * 发送 IPC 事件
   */
  abstract emit<K extends keyof IpcEvents>(
    event: K,
    data: IpcEvents[K]
  ): void;
}

/**
 * IPC 装饰器 - 用于标记处理函数
 */
export function IpcHandle<K extends keyof IpcChannels>(channel: K) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 存储元数据供运行时使用
    Reflect.defineMetadata('ipc:channel', channel, target, propertyKey);
    Reflect.defineMetadata('ipc:type', 'handle', target, propertyKey);
    
    return descriptor;
  };
}

/**
 * IPC 事件装饰器 - 用于标记事件监听函数
 */
export function IpcOn<K extends keyof IpcEvents>(event: K) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 存储元数据供运行时使用
    Reflect.defineMetadata('ipc:event', event, target, propertyKey);
    Reflect.defineMetadata('ipc:type', 'on', target, propertyKey);
    
    return descriptor;
  };
}

/**
 * IPC 响应包装器
 */
export class IpcResponse<T = any> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly error?: string,
    public readonly code?: number
  ) {}

  static success<T>(data: T): IpcResponse<T> {
    return new IpcResponse(true, data);
  }

  static error(error: string, code = 500): IpcResponse<null> {
    return new IpcResponse(false, null, error, code);
  }

  toJSON() {
    return {
      success: this.success,
      data: this.data,
      error: this.error,
      code: this.code,
    };
  }
}

/**
 * IPC 客户端接口 - 用于渲染进程
 */
export interface IpcClient {
  /**
   * 调用 IPC 方法
   */
  invoke<K extends keyof IpcChannels>(
    channel: K,
    request: IpcChannels[K]['request']
  ): Promise<IpcChannels[K]['response']>;
  
  /**
   * 监听 IPC 事件
   */
  on<K extends keyof IpcEvents>(
    event: K,
    listener: (data: IpcEvents[K]) => void
  ): void;
  
  /**
   * 移除 IPC 事件监听器
   */
  off<K extends keyof IpcEvents>(
    event: K,
    listener: (data: IpcEvents[K]) => void
  ): void;
  
  /**
   * 发送 IPC 事件（仅在某些场景下需要）
   */
  emit<K extends keyof IpcEvents>(
    event: K,
    data: IpcEvents[K]
  ): void;
}

/**
 * IPC 服务端接口 - 用于主进程
 */
export interface IpcServer {
  /**
   * 注册 IPC 处理器
   */
  handle<K extends keyof IpcChannels>(
    channel: K,
    handler: (request: IpcChannels[K]['request']) => Promise<IpcChannels[K]['response']>
  ): void;
  
  /**
   * 移除 IPC 处理器
   */
  removeHandler<K extends keyof IpcChannels>(channel: K): void;
  
  /**
   * 向所有渲染进程发送事件
   */
  broadcast<K extends keyof IpcEvents>(
    event: K,
    data: IpcEvents[K]
  ): void;
  
  /**
   * 向特定窗口发送事件
   */
  send<K extends keyof IpcEvents>(
    windowId: number,
    event: K,
    data: IpcEvents[K]
  ): void;
}