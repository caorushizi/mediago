import { IpcResponse } from '../types';

/**
 * 通用工具类 - 统一管理所有公共工具函数
 * 替代散布在各个包中的重复代码
 */
export class CommonUtils {
  /**
   * 异步延迟函数
   * @param seconds 延迟秒数，默认1秒
   */
  static async sleep(seconds = 1): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  /**
   * 格式化HTTP头部为字符串
   * @param headers HTTP头部对象
   * @returns 格式化后的字符串
   */
  static formatHeaders(headers: Record<string, string>): string {
    if (!headers) return '';
    return Object.entries(headers)
      .map(([key, value]) => `${key}:${value}`)
      .join('\n');
  }

  /**
   * 创建成功响应
   * @param data 响应数据
   * @returns 标准化的成功响应
   */
  static success<T>(data: T): IpcResponse<T> {
    return {
      code: 0,
      message: 'success',
      data,
    };
  }

  /**
   * 创建错误响应
   * @param message 错误消息
   * @returns 标准化的错误响应
   */
  static error(message = 'fail'): IpcResponse<null> {
    return {
      code: -1,
      message,
      data: null,
    };
  }

  /**
   * 获取本地IP地址
   * @returns 本地IP地址字符串
   */
  static getLocalIP(): string {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIP = '';

    // 遍历网络接口
    for (const key in interfaces) {
      const iface = interfaces[key];
      if (!iface) continue;

      // 筛选出IPv4且非环回地址
      const filteredIface = iface.filter(
        (details) => details.family === 'IPv4' && !details.internal
      );

      if (filteredIface.length > 0) {
        localIP = filteredIface[0].address;
        break;
      }
    }

    return localIP;
  }

  /**
   * 空函数 - 用于默认回调
   */
  static noop(): void {
    // 空实现
  }

  /**
   * 防抖函数
   * @param func 要防抖的函数
   * @param wait 防抖时间（毫秒）
   * @returns 防抖后的函数
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * 节流函数
   * @param func 要节流的函数
   * @param limit 节流时间（毫秒）
   * @returns 节流后的函数
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * 深拷贝对象
   * @param obj 要拷贝的对象
   * @returns 深拷贝后的对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as unknown as T;
    if (typeof obj === 'object') {
      const clonedObj = {} as { [key: string]: any };
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj as T;
    }
    return obj;
  }

  /**
   * 重试机制
   * @param fn 要重试的异步函数
   * @param retries 重试次数
   * @param delay 重试间隔（毫秒）
   * @returns Promise
   */
  static async retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries) throw error;
        await this.sleep(delay / 1000);
      }
    }
    throw new Error('Retry failed');
  }
}