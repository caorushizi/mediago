import { injectable, inject } from 'inversify';
import _ from 'lodash';
import { Window } from '../base/Window';
import { TYPES } from '@mediago/shared/node';
import { ElectronLogger } from '../vendor/ElectronLogger';
import { TaskQueueService } from '@mediago/shared/node';
import { VideoRepository } from '@mediago/shared/node';
import { ElectronStore } from '../vendor/ElectronStore';
import { DownloadStatus } from '@mediago/shared/common';
import { 
  ErrorHandler, 
  PerformanceMonitor, 
  MonitorAsync,
  DownloadError,
  IpcHandle,
  IpcChannels,
  AppError
} from '@mediago/shared/common';

interface DownloadItemState {
  id: number;
  status: DownloadStatus;
  progress: number;
  speed: number;
  error?: string;
}

interface DownloadState {
  [id: number]: DownloadItemState;
}

/**
 * 优化后的主窗口类
 * 集成了错误处理、性能监控和类型安全的 IPC
 */
@injectable()
export default class MainWindow extends Window {
  url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
  private initialUrl: string | null = null;
  private downloadState: DownloadState = {};
  private readonly THROTTLE_TIME = 500; // 500ms 的节流时间

  constructor(
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(TYPES.TaskQueueService)
    private readonly taskQueue: TaskQueueService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore
  ) {
    super();
    
    // 设置错误处理日志器
    ErrorHandler.setLogger({
      error: (message: string, meta?: any) => {
        this.logger.error(message, meta);
      }
    });

    this.initializeEventListeners();
    
    // 使用节流函数定期发送状态更新
    this.sendStateUpdate = _.throttle(this.sendStateUpdate, this.THROTTLE_TIME);
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    this.taskQueue.on("download-start", this.onDownloadStart);
    this.taskQueue.on("download-progress", this.onDownloadProgress);
    this.taskQueue.on("download-success", this.onDownloadSuccess);
    this.taskQueue.on("download-failed", this.onDownloadFailed);
    this.taskQueue.on("download-stop", this.onDownloadStop);
    this.taskQueue.on("download-message", this.onDownloadMessage);
    this.store.onDidAnyChange(this.storeChange);
  }

  /**
   * 处理获取视频列表请求
   */
  @IpcHandle('get-videos')
  @MonitorAsync('get-videos')
  async handleGetVideos(
    request: IpcChannels['get-videos']['request']
  ): Promise<IpcChannels['get-videos']['response']> {
    try {
      return await this.videoRepository.getVideos(request);
    } catch (error) {
      throw ErrorHandler.normalizeError(error);
    }
  }

  /**
   * 处理下载视频请求
   */
  @IpcHandle('download-video')
  @MonitorAsync('download-video')
  async handleDownloadVideo(
    request: IpcChannels['download-video']['request']
  ): Promise<IpcChannels['download-video']['response']> {
    try {
      const { url, quality, folder, headers } = request;
      
      // 验证 URL
      if (!url || !this.isValidUrl(url)) {
        throw new DownloadError('Invalid URL provided', { url });
      }

      const taskId = await this.taskQueue.addDownloadTask({
        url,
        quality: quality || 'best',
        folder: folder || this.store.get('downloadPath'),
        headers: headers || {}
      });

      this.logger.info(`Download task created: ${taskId} for URL: ${url}`);
      
      return { taskId };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new DownloadError('Failed to start download', { url: request.url });
    }
  }

  /**
   * 处理暂停下载请求
   */
  @IpcHandle('pause-download')
  @MonitorAsync('pause-download')
  async handlePauseDownload(
    request: IpcChannels['pause-download']['request']
  ): Promise<void> {
    try {
      await this.taskQueue.pauseTask(request.taskId);
      this.logger.info(`Download paused: ${request.taskId}`);
    } catch (error) {
      throw new DownloadError('Failed to pause download', { taskId: request.taskId });
    }
  }

  /**
   * 处理恢复下载请求
   */
  @IpcHandle('resume-download')
  @MonitorAsync('resume-download') 
  async handleResumeDownload(
    request: IpcChannels['resume-download']['request']
  ): Promise<void> {
    try {
      await this.taskQueue.resumeTask(request.taskId);
      this.logger.info(`Download resumed: ${request.taskId}`);
    } catch (error) {
      throw new DownloadError('Failed to resume download', { taskId: request.taskId });
    }
  }

  /**
   * 发送状态更新（使用节流）
   */
  private sendStateUpdate = () => {
    this.send("download-state-update", this.downloadState);
  };

  /**
   * 更新下载状态
   */
  private updateDownloadState = (
    id: number,
    updates: Partial<DownloadItemState>
  ) => {
    if (!this.downloadState[id]) {
      this.downloadState[id] = {
        id,
        status: DownloadStatus.Ready,
        progress: 0,
        speed: 0,
      };
    }

    Object.assign(this.downloadState[id], updates);
    this.sendStateUpdate();
  };

  /**
   * 清理下载状态
   */
  private cleanupDownloadState(id: number) {
    delete this.downloadState[id];
    this.sendStateUpdate();
  }

  /**
   * 下载开始事件处理
   */
  private onDownloadStart = async (id: number) => {
    PerformanceMonitor.recordMetric('downloads_started', 1);
    this.logger.info(`taskId: ${id} start`);
    
    try {
      await this.videoRepository.changeVideoStatus(id, DownloadStatus.Downloading);
      this.updateDownloadState(id, { status: DownloadStatus.Downloading });
    } catch (error) {
      this.logger.error(`Failed to update video status for task ${id}`, error);
      this.updateDownloadState(id, { 
        status: DownloadStatus.Failed,
        error: 'Failed to update status'
      });
    }
  };

  /**
   * 下载进度事件处理
   */
  private onDownloadProgress = (data: { id: number; progress: number; speed: number }) => {
    const { id, progress, speed } = data;
    this.updateDownloadState(id, {
      status: DownloadStatus.Downloading,
      progress: Math.round(progress),
      speed: Math.round(speed)
    });
  };

  /**
   * 下载成功事件处理
   */
  private onDownloadSuccess = async (id: number) => {
    PerformanceMonitor.recordMetric('downloads_completed', 1);
    this.logger.info(`taskId: ${id} success`);

    try {
      await this.videoRepository.changeVideoStatus(id, DownloadStatus.Success);
      this.updateDownloadState(id, { 
        status: DownloadStatus.Success,
        progress: 100
      });

      // 显示成功通知
      this.window?.webContents.send('notification', {
        title: 'Download Complete',
        message: 'Video downloaded successfully',
        type: 'success'
      });
    } catch (error) {
      this.logger.error(`Failed to update video status for task ${id}`, error);
    }

    // 延迟清理状态，确保前端有足够时间处理最后的成功状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 5000);
  };

  /**
   * 下载失败事件处理
   */
  private onDownloadFailed = async (data: { id: number; error: string }) => {
    PerformanceMonitor.recordMetric('downloads_failed', 1);
    const { id, error } = data;
    this.logger.error(`taskId: ${id} failed: ${error}`);

    try {
      await this.videoRepository.changeVideoStatus(id, DownloadStatus.Failed);
      this.updateDownloadState(id, { 
        status: DownloadStatus.Failed,
        error
      });

      // 显示错误通知
      this.window?.webContents.send('notification', {
        title: 'Download Failed',
        message: error || 'Unknown error occurred',
        type: 'error'
      });
    } catch (updateError) {
      this.logger.error(`Failed to update video status for task ${id}`, updateError);
    }

    // 延迟清理状态，确保前端有足够时间处理最后的失败状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 5000);
  };

  /**
   * 下载停止事件处理
   */
  private onDownloadStop = async (id: number) => {
    this.logger.info(`taskId: ${id} stopped`);
    
    try {
      await this.videoRepository.changeVideoStatus(id, DownloadStatus.Stopped);
      this.updateDownloadState(id, { status: DownloadStatus.Stopped });
    } catch (error) {
      this.logger.error(`Failed to update video status for task ${id}`, error);
    }

    // 延迟清理状态，确保前端有足够时间处理最后的停止状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 3000);
  };

  /**
   * 下载消息事件处理
   */
  private onDownloadMessage = (data: any) => {
    this.send("download-message", data);
  };

  /**
   * 存储变化事件处理
   */
  private storeChange = (newValue: any, oldValue: any) => {
    this.send("store-changed", { newValue, oldValue });
  };

  /**
   * 验证 URL 格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 生成性能报告
   */
  generatePerformanceReport(): string {
    return PerformanceMonitor.generateReport();
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    return MemoryMonitor.getMemoryUsage();
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 清理事件监听器
    this.taskQueue.removeAllListeners();
    
    // 清理性能监控数据
    PerformanceMonitor.clearAll();
    
    super.destroy();
  }
}