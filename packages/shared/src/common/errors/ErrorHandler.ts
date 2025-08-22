/**
 * 统一错误处理基类
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string, 
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * 下载相关错误
 */
export class DownloadError extends AppError {
  readonly code = 'DOWNLOAD_ERROR';
  readonly statusCode = 500;

  constructor(message: string, context?: { url?: string; taskId?: number }) {
    super(message, context);
  }
}

/**
 * 网络请求错误
 */
export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 503;

  constructor(message: string, context?: { url?: string; method?: string }) {
    super(message, context);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string, context?: { field?: string; value?: any }) {
    super(message, context);
  }
}

/**
 * 文件系统错误
 */
export class FileSystemError extends AppError {
  readonly code = 'FILESYSTEM_ERROR';
  readonly statusCode = 500;

  constructor(message: string, context?: { path?: string; operation?: string }) {
    super(message, context);
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(message: string, context?: { entity?: string; operation?: string }) {
    super(message, context);
  }
}

/**
 * 权限错误
 */
export class PermissionError extends AppError {
  readonly code = 'PERMISSION_ERROR';
  readonly statusCode = 403;

  constructor(message: string, context?: { resource?: string; action?: string }) {
    super(message, context);
  }
}

/**
 * 配置错误
 */
export class ConfigurationError extends AppError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 500;

  constructor(message: string, context?: { key?: string; value?: any }) {
    super(message, context);
  }
}

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  private static logger?: {
    error: (message: string, meta?: any) => void;
  };

  static setLogger(logger: { error: (message: string, meta?: any) => void }) {
    this.logger = logger;
  }

  /**
   * 处理错误并返回标准响应
   */
  static handle(error: unknown): {
    code: number;
    message: string;
    data: null;
    stack?: string;
  } {
    if (error instanceof AppError) {
      this.logError(error);
      return {
        code: error.statusCode,
        message: error.message,
        data: null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    if (error instanceof Error) {
      this.logError(error);
      return {
        code: 500,
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Internal server error',
        data: null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    // 未知错误
    const unknownError = new Error(String(error));
    this.logError(unknownError);
    return {
      code: 500,
      message: 'Unknown error occurred',
      data: null,
    };
  }

  /**
   * 异步错误处理装饰器
   */
  static asyncHandler<T extends (...args: any[]) => Promise<any>>(
    fn: T
  ): T {
    return ((...args: Parameters<T>) => {
      return Promise.resolve(fn(...args)).catch((error) => {
        throw this.normalizeError(error);
      });
    }) as T;
  }

  /**
   * 标准化错误对象
   */
  static normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // 根据错误类型创建相应的 AppError
      if (error.message.includes('ENOENT') || error.message.includes('EACCES')) {
        return new FileSystemError(error.message);
      }
      
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return new NetworkError(error.message);
      }

      // 默认为通用错误
      return new class extends AppError {
        readonly code = 'UNKNOWN_ERROR';
        readonly statusCode = 500;
      }(error.message);
    }

    return new class extends AppError {
      readonly code = 'UNKNOWN_ERROR';
      readonly statusCode = 500;
    }(String(error));
  }

  /**
   * 记录错误日志
   */
  private static logError(error: Error): void {
    if (this.logger) {
      this.logger.error(error.message, {
        name: error.name,
        stack: error.stack,
        ...(error instanceof AppError ? { 
          code: error.code,
          context: error.context 
        } : {}),
      });
    } else {
      console.error('Error:', error);
    }
  }
}

/**
 * 错误处理装饰器
 */
export function HandleErrors(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      throw ErrorHandler.normalizeError(error);
    }
  };

  return descriptor;
}