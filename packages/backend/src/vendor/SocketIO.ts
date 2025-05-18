import { inject, injectable } from "inversify";
import { Vendor } from "../core/vendor.ts";
import http from "http";
import { Server } from "socket.io";
import { TYPES } from "@mediago/shared/node";
import { TaskQueueService } from "@mediago/shared/node";
import { DownloadProgress, DownloadStatus } from "@mediago/shared/common";
import { VideoRepository } from "@mediago/shared/node";
import Logger from "./Logger.ts";
import StoreService from "./Store.ts";
import _ from "lodash";

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
  private readonly THROTTLE_TIME = 500; // 500ms 的节流时间
  private downloadState: DownloadState = {};

  constructor(
    @inject(TYPES.TaskQueueService)
    private readonly taskQueueService: TaskQueueService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.StoreService)
    private readonly store: StoreService
  ) {
    // 使用节流函数优化状态更新
    this.sendStateUpdate = _.throttle(this.sendStateUpdate, this.THROTTLE_TIME);
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

  private sendStateUpdate = () => {
    this.io.emit("download-state-update", "message", this.downloadState);
  };

  private updateDownloadState = (
    id: number,
    updates: Partial<DownloadItemState>
  ) => {
    if (!this.downloadState[id]) {
      this.downloadState[id] = {
        id,
        status: DownloadStatus.Ready,
        progress: 0,
        messages: [],
      };
    }

    this.downloadState[id] = {
      ...this.downloadState[id],
      ...updates,
    };

    this.sendStateUpdate();
  };

  private cleanupDownloadState = (id: number) => {
    if (this.downloadState[id]) {
      delete this.downloadState[id];
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
