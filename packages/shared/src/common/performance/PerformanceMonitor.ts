/**
 * 性能监控工具类
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static activeTimers = new Map<string, number>();

  /**
   * 开始计时
   * @param name 性能指标名称
   * @returns 停止计时的函数
   */
  static startTimer(name: string): () => number {
    const start = performance.now();
    this.activeTimers.set(name, start);
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      this.activeTimers.delete(name);
      return duration;
    };
  }

  /**
   * 测量异步函数执行时间
   * @param name 性能指标名称
   * @param fn 要测量的异步函数
   * @returns 函数执行结果
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const stopTimer = this.startTimer(name);
    try {
      const result = await fn();
      const duration = stopTimer();
      console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      stopTimer();
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   * @param name 性能指标名称
   * @param fn 要测量的同步函数
   * @returns 函数执行结果
   */
  static measureSync<T>(name: string, fn: () => T): T {
    const stopTimer = this.startTimer(name);
    try {
      const result = fn();
      const duration = stopTimer();
      console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      stopTimer();
      throw error;
    }
  }

  /**
   * 记录性能指标
   * @param name 指标名称
   * @param value 指标值（毫秒）
   */
  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // 限制每个指标最多保存1000个记录
    const records = this.metrics.get(name)!;
    if (records.length > 1000) {
      records.shift();
    }
  }

  /**
   * 获取性能统计信息
   * @param name 指标名称
   * @returns 统计信息
   */
  static getStats(name: string): PerformanceStats | null {
    const records = this.metrics.get(name);
    if (!records || records.length === 0) {
      return null;
    }

    const sorted = [...records].sort((a, b) => a - b);
    const sum = records.reduce((acc, val) => acc + val, 0);
    
    return {
      name,
      count: records.length,
      min: Math.min(...records),
      max: Math.max(...records),
      avg: sum / records.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      total: sum,
    };
  }

  /**
   * 获取所有性能指标
   * @returns 所有指标的统计信息
   */
  static getAllStats(): Record<string, PerformanceStats> {
    const result: Record<string, PerformanceStats> = {};
    
    for (const name of this.metrics.keys()) {
      const stats = this.getStats(name);
      if (stats) {
        result[name] = stats;
      }
    }
    
    return result;
  }

  /**
   * 清除指定指标的数据
   * @param name 指标名称
   */
  static clearMetric(name: string): void {
    this.metrics.delete(name);
    this.activeTimers.delete(name);
  }

  /**
   * 清除所有指标数据
   */
  static clearAll(): void {
    this.metrics.clear();
    this.activeTimers.clear();
  }

  /**
   * 生成性能报告
   * @returns 格式化的性能报告
   */
  static generateReport(): string {
    const stats = this.getAllStats();
    if (Object.keys(stats).length === 0) {
      return 'No performance data available';
    }

    let report = '📊 Performance Report\n';
    report += '='.repeat(50) + '\n\n';

    for (const [name, stat] of Object.entries(stats)) {
      report += `🔍 ${name}\n`;
      report += `   Count: ${stat.count}\n`;
      report += `   Average: ${stat.avg.toFixed(2)}ms\n`;
      report += `   Min/Max: ${stat.min.toFixed(2)}ms / ${stat.max.toFixed(2)}ms\n`;
      report += `   Median: ${stat.median.toFixed(2)}ms\n`;
      report += `   P95/P99: ${stat.p95.toFixed(2)}ms / ${stat.p99.toFixed(2)}ms\n`;
      report += `   Total: ${stat.total.toFixed(2)}ms\n\n`;
    }

    return report;
  }

  /**
   * 导出性能数据为 JSON
   * @returns JSON 格式的性能数据
   */
  static exportData(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.getAllStats(),
      raw: Object.fromEntries(this.metrics),
    }, null, 2);
  }

  /**
   * 监控函数调用频率
   * @param name 函数名称
   * @param fn 要监控的函数
   * @returns 包装后的函数
   */
  static monitorFunction<T extends (...args: any[]) => any>(
    name: string,
    fn: T
  ): T {
    return ((...args: Parameters<T>) => {
      const stopTimer = this.startTimer(`${name}_duration`);
      this.recordMetric(`${name}_calls`, 1);
      
      try {
        const result = fn(...args);
        
        if (result instanceof Promise) {
          return result.finally(() => stopTimer()) as ReturnType<T>;
        } else {
          stopTimer();
          return result;
        }
      } catch (error) {
        stopTimer();
        this.recordMetric(`${name}_errors`, 1);
        throw error;
      }
    }) as T;
  }
}

/**
 * 性能统计信息接口
 */
export interface PerformanceStats {
  name: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
  total: number;
}

/**
 * 性能监控装饰器
 * @param name 性能指标名称
 */
export function Monitor(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return PerformanceMonitor.measureSync(metricName, () => 
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * 异步性能监控装饰器
 * @param name 性能指标名称
 */
export function MonitorAsync(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return PerformanceMonitor.measureAsync(metricName, () => 
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  /**
   * 获取当前内存使用情况
   */
  static getMemoryUsage(): MemoryUsage {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        rss: this.formatBytes(usage.rss),
        heapTotal: this.formatBytes(usage.heapTotal),
        heapUsed: this.formatBytes(usage.heapUsed),
        external: this.formatBytes(usage.external),
        arrayBuffers: this.formatBytes(usage.arrayBuffers || 0),
      };
    }
    
    return {
      rss: 'N/A',
      heapTotal: 'N/A',
      heapUsed: 'N/A',
      external: 'N/A',
      arrayBuffers: 'N/A',
    };
  }

  /**
   * 格式化字节数
   */
  private static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 生成内存报告
   */
  static generateReport(): string {
    const usage = this.getMemoryUsage();
    
    let report = '💾 Memory Usage Report\n';
    report += '='.repeat(30) + '\n';
    report += `RSS: ${usage.rss}\n`;
    report += `Heap Total: ${usage.heapTotal}\n`;
    report += `Heap Used: ${usage.heapUsed}\n`;
    report += `External: ${usage.external}\n`;
    report += `Array Buffers: ${usage.arrayBuffers}\n`;
    
    return report;
  }
}

/**
 * 内存使用信息接口
 */
export interface MemoryUsage {
  rss: string;
  heapTotal: string;
  heapUsed: string;
  external: string;
  arrayBuffers: string;
}