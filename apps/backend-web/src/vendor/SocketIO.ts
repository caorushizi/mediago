import { type DownloadProgress, DownloadStatus } from "@mediago/shared/common";
import { type TaskQueueService, TYPES, type VideoRepository } from "@mediago/shared/node";
import type http from "http";
import { inject, injectable } from "inversify";
import _ from "lodash";
import { Server } from "socket.io";
import type { Vendor } from "../core/vendor";
import type Logger from "./Logger";
import type StoreService from "./Store";

interface DownloadItemState {
  id: number;
  status: DownloadStatus;
  progress: number;
  isLive?: boolean;
  messages: string[];
  name?: string;
  speed?: string;
}

interface DownloadState {
  [key: number]: DownloadItemState;
}

@injectable()
export default class SocketIO implements Vendor {
  io: Server;
  private readonly THROTTLE_TIME = 300; // 减少到 300ms 以提高响应性
  private readonly PROGRESS_THRESHOLD = 1; // 进度变化阈值 1%
  private downloadState: DownloadState = {};
  private lastSentState: DownloadState = {}; // 记录上次发送的状态
  private pendingUpdates = new Set<number>(); // 待处理的更新队列
  private sendStateUpdate: () => void; // 节流函数

  constructor(
    @inject(TYPES.TaskQueueService)
    private readonly taskQueueService: TaskQueueService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.StoreService)
    private readonly store: StoreService,
  ) {
    // 使用节流函数优化状态更新，并添加批量处理
    this.sendStateUpdate = _.throttle(this.sendBatchStateUpdate.bind(this), this.THROTTLE_TIME);
  }

  async init() {}

  async initSocketIO(server: http.Server) {
    this.io = new Server(server, {
      /* options */
      cors: {
        origin: "*",
      },
    });

    this.taskQueueService.on("download-ready-start", this.onDownloadReadyStart);
    this.taskQueueService.on("download-progress", this.onDownloadProgress);
    this.taskQueueService.on("download-success", this.onDownloadSuccess);
    this.taskQueueService.on("download-failed", this.onDownloadFailed);
    this.taskQueueService.on("download-start", this.onDownloadStart);
    this.taskQueueService.on("download-stop", this.onDownloadStop);
    this.taskQueueService.on("download-message", this.receiveMessage);
  }

  // 检查状态是否有实质性变化
  private hasSignificantChange = (id: number, updates: Partial<DownloadItemState>): boolean => {
    const current = this.downloadState[id];
    const lastSent = this.lastSentState[id];

    // 状态变化总是需要发送
    if (updates.status !== undefined && updates.status !== current?.status) {
      return true;
    }

    // 实时流状态变化需要发送
    if (updates.isLive !== undefined && updates.isLive !== current?.isLive) {
      return true;
    }

    // 进度变化超过阈值才发送
    if (updates.progress !== undefined && lastSent) {
      const progressDiff = Math.abs(updates.progress - (lastSent.progress || 0));
      if (progressDiff >= this.PROGRESS_THRESHOLD) {
        return true;
      }
    }

    // 首次进度更新
    if (updates.progress !== undefined && !lastSent) {
      return true;
    }

    // 消息更新（但限制频率）
    if (updates.messages !== undefined) {
      return true;
    }

    return false;
  };

  // 批量发送状态更新
  private sendBatchStateUpdate = () => {
    if (this.pendingUpdates.size === 0) return;

    // 发送当前完整的状态，包括清理信息
    const updatedState: DownloadState = { ...this.downloadState };

    // 如果有状态需要更新，发送完整的当前状态
    if (this.pendingUpdates.size > 0) {
      this.io.emit("download-state-update", "message", updatedState);

      // 更新已发送状态的记录
      this.lastSentState = { ...updatedState };
    }

    // 清空待处理队列
    this.pendingUpdates.clear();
  };

  private updateDownloadState = (id: number, updates: Partial<DownloadItemState>) => {
    if (!this.downloadState[id]) {
      this.downloadState[id] = {
        id,
        status: DownloadStatus.Ready,
        progress: 0,
        messages: [],
      };
    }

    const oldState = { ...this.downloadState[id] };
    this.downloadState[id] = {
      ...this.downloadState[id],
      ...updates,
    };

    // 检查是否有实质性变化
    if (this.hasSignificantChange(id, updates)) {
      this.pendingUpdates.add(id);
      this.sendStateUpdate();
    }
  };

  private cleanupDownloadState = (id: number) => {
    if (this.downloadState[id]) {
      delete this.downloadState[id];
      delete this.lastSentState[id]; // 同时清理发送状态记录
      this.pendingUpdates.add(id); // 标记需要发送清理状态
      this.sendStateUpdate();
    }
  };

  onDownloadReadyStart = async ({ id, isLive }: DownloadProgress) => {
    if (isLive) {
      await this.videoRepository.changeVideoIsLive(id);
      this.updateDownloadState(id, { isLive });
    }
  };

  onDownloadProgress = (progress: DownloadProgress) => {
    this.logger.info(`download task: ${progress.id}`, JSON.stringify(progress));
    this.updateDownloadState(progress.id, {
      progress: Number(progress.percent) || 0,
      speed: progress.speed,
      isLive: progress.isLive,
    });
  };

  onDownloadSuccess = async (id: number) => {
    this.logger.info(`download task: ${id} success`);
    this.updateDownloadState(id, { status: DownloadStatus.Success });
    // 延迟清理状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 5000);
  };

  onDownloadFailed = async (id: number, err: unknown) => {
    this.logger.error(`download task: ${id} failed: ${err}`);
    this.updateDownloadState(id, { status: DownloadStatus.Failed });
    // 延迟清理状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 5000);
  };

  onDownloadStart = async (id: number) => {
    this.logger.info(`download task: ${id} start`);
    this.updateDownloadState(id, { status: DownloadStatus.Downloading });
  };

  onDownloadStop = async (id: number) => {
    this.logger.info(`download task: ${id} stop`);
    this.updateDownloadState(id, { status: DownloadStatus.Stopped });
    // 延迟清理状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 5000);
  };

  receiveMessage = async (id: number, message: string) => {
    await this.videoRepository.appendDownloadLog(id, message);
    this.updateDownloadState(id, {
      messages: [...(this.downloadState[id]?.messages || []), message],
    });
  };

  refreshList = async () => {
    this.io.emit("refresh-list");
  };
}
