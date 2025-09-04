import { resolve } from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { type DownloadProgress, DownloadStatus, i18n } from "@mediago/shared/common";
import { TaskQueueService, TYPES, VideoRepository } from "@mediago/shared/node";
import { app, Menu, Notification } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import _ from "lodash";
import Window from "../core/window";
import { isWin } from "../helper/variables";
import ElectronLogger from "../vendor/ElectronLogger";
import ElectronStore from "../vendor/ElectronStore";

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
@provide()
export default class MainWindow extends Window {
  url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
  private initialUrl: string | null = null;
  private downloadState: DownloadState = {};
  private lastSentState: DownloadState = {}; // 记录上次发送的状态
  private pendingUpdates = new Set<number>(); // 待处理的更新队列
  private readonly THROTTLE_TIME = 300; // 减少到 300ms 以提高响应性
  private readonly PROGRESS_THRESHOLD = 1; // 进度变化阈值 1%
  private sendStateUpdate: () => void; // 节流函数

  constructor(
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(TaskQueueService)
    private readonly taskQueue: TaskQueueService,
    @inject(VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(ElectronStore)
    private readonly store: ElectronStore,
  ) {
    super({
      width: 1100,
      minWidth: 1100,
      height: 680,
      minHeight: 680,
      show: false,
      frame: true,
      webPreferences: {
        preload: resolve(__dirname, "./preload.js"),
      },
    });

    this.taskQueue.on("download-ready-start", this.onDownloadReadyStart);
    this.taskQueue.on("download-progress", this.onDownloadProgress);
    this.taskQueue.on("download-success", this.onDownloadSuccess);
    this.taskQueue.on("download-failed", this.onDownloadFailed);
    this.taskQueue.on("download-start", this.onDownloadStart);
    this.taskQueue.on("download-stop", this.onDownloadStop);
    this.taskQueue.on("download-message", this.onDownloadMessage);
    this.store.onDidAnyChange(this.storeChange);

    // 使用节流函数定期发送状态更新，并添加批量处理
    this.sendStateUpdate = _.throttle(this.sendBatchStateUpdate.bind(this), this.THROTTLE_TIME);
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

    // 消息更新（但需要检查是否真的有新消息）
    if (updates.messages !== undefined) {
      const currentMsgCount = current?.messages?.length || 0;
      const newMsgCount = updates.messages.length;
      return newMsgCount > currentMsgCount;
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
      this.send("download-state-update", updatedState);

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

  closeMainWindow = () => {
    const { closeMainWindow } = this.store.store;
    if (closeMainWindow) {
      app.quit();
    }
  };

  onDownloadReadyStart = async ({ id, isLive }: DownloadProgress) => {
    if (isLive) {
      await this.videoRepository.changeVideoIsLive(id);
      this.updateDownloadState(id, { isLive });
    }
  };

  init(): void {
    if (this.window) {
      // If the window already exists, it is displayed directly
      this.window.show();
      return;
    }

    Menu.setApplicationMenu(null);

    this.window = this.create();

    const mainBounds = this.store.get("mainBounds");
    if (mainBounds) {
      this.window.setBounds(mainBounds);
    }

    // Handle current window resize
    this.window.on("resized", this.handleResize);
    this.window.on("close", this.closeMainWindow);
    // if (process.defaultApp) {
    //   // dev
    //   if (process.argv.length >= 2) {
    //     const urlArg = process.argv.find((arg) => arg.startsWith("mediago://"));
    //     if (urlArg) {
    //       this.initialUrl = urlArg;
    //     }
    //   }
    // } else {
    //   // prod
    //   if (process.argv.length >= 2) {
    //     const urlArg = process.argv[1];
    //     if (urlArg.startsWith("mediago://")) {
    //       this.initialUrl = urlArg;
    //     }
    //   }
    // }
    // this.window.webContents.on("did-finish-load", () => {
    //   if (this.initialUrl) {
    //     this.send("url-params", this.initialUrl);
    //   }
    // });

    // if (this.initialUrl) {
    //   this.window.webContents.send("url-params", this.initialUrl);
    // }
  }

  handleResize = () => {
    if (!this.window) return;

    const bounds = this.window.getBounds();
    this.store.set("mainBounds", _.omit(bounds, ["x", "y"]));
  };

  storeChange = (store: unknown) => {
    // Send notifications to all Windows
    this.send("store-change", store);
  };

  onDownloadProgress = (progress: DownloadProgress) => {
    this.updateDownloadState(progress.id, {
      progress: Number(progress.percent) || 0,
      speed: progress.speed,
      isLive: progress.isLive,
    });
  };

  private cleanupDownloadState = (id: number) => {
    if (this.downloadState[id]) {
      delete this.downloadState[id];
      delete this.lastSentState[id]; // 同时清理发送状态记录
      this.pendingUpdates.add(id); // 标记需要发送清理状态
      this.sendStateUpdate();
    }
  };

  onDownloadSuccess = async (id: number) => {
    this.logger.info(`taskId: ${id} success`);
    await this.videoRepository.changeVideoStatus(id, DownloadStatus.Success);
    this.updateDownloadState(id, { status: DownloadStatus.Success });

    const promptTone = this.store.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);
      this.updateDownloadState(id, { name: video.name });

      new Notification({
        title: i18n.t("downloadSuccess"),
        body: i18n.t("videoDownloadSuccess", {
          name: video.name,
        }),
      }).show();
    }

    // 延迟清理状态，确保前端有足够时间处理最后的成功状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 5000);
  };

  onDownloadFailed = async (id: number, err: unknown) => {
    this.logger.info(`taskId: ${id} failed`, err);
    await this.videoRepository.changeVideoStatus(id, DownloadStatus.Failed);
    this.updateDownloadState(id, { status: DownloadStatus.Failed });

    const promptTone = this.store.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);
      new Notification({
        title: i18n.t("downloadFailed"),
        body: i18n.t("videoDownloadFailed", { name: video.name }),
      }).show();
    }

    // 延迟清理状态，确保前端有足够时间处理最后的失败状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 5000);
  };

  onDownloadStart = async (id: number) => {
    this.logger.info(`taskId: ${id} start`);
    await this.videoRepository.changeVideoStatus(id, DownloadStatus.Downloading);
    this.updateDownloadState(id, { status: DownloadStatus.Downloading });
  };

  onDownloadStop = async (id: number) => {
    this.logger.info(`taskId: ${id} stopped`);
    await this.videoRepository.changeVideoStatus(id, DownloadStatus.Stopped);
    this.updateDownloadState(id, { status: DownloadStatus.Stopped });

    // 延迟清理状态，确保前端有足够时间处理最后的停止状态
    setTimeout(() => {
      this.cleanupDownloadState(id);
    }, 5000);
  };

  onDownloadMessage = async (id: number, message: string) => {
    await this.videoRepository.appendDownloadLog(id, message);
    const showTerminal = this.store.get("showTerminal");
    if (showTerminal) {
      this.updateDownloadState(id, {
        messages: [...(this.downloadState[id]?.messages || []), message],
      });
    }
  };

  send(channel: string, ...args: unknown[]) {
    if (!this.window) return;

    this.window.webContents.send(channel, ...args);
    // if (!this.window) {
    //   this.init(); // If the window is closed, reinitialize the window
    // }

    // if (this.window) {
    //   this.window.webContents.send(channel, ...args); // Send message to renderer process
    // }
  }

  showWindow(url?: string) {
    if (isWin) {
      if (this.window) {
        if (this.window.isMinimized()) {
          this.window.restore();
        }
        if (this.window.isVisible()) {
          this.window.focus();
        } else {
          this.window.show();
        }
      } else {
        this.init();
      }

      if (url) {
        this.window!.loadURL(url);
      }
    }
  }

  // Handle URL in the form of mediago://
  handleUrl(url: string) {
    if (!this.window) {
      this.init();
    }

    if (this.window) {
      if (this.window.isMinimized()) {
        this.window.restore();
      }
      this.window.focus();
    }

    this.send("url-params", url); // Send the URL to the renderer process

    if (url) {
      this.window!.loadURL(url);
    }
  }
}
