import { Menu, Notification, app } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "@mediago/shared/node";
import { DownloadProgress, DownloadStatus } from "@mediago/shared/common";
import _ from "lodash";
import Window from "../core/window.ts";
import ElectronLogger from "../vendor/ElectronLogger.ts";
import ElectronStore from "../vendor/ElectronStore.ts";
import { VideoRepository, TaskQueueService } from "@mediago/shared/node";
import { i18n } from "@mediago/shared/common";
import { isWin } from "../helper/variables.ts";

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

    // 使用节流函数定期发送状态更新
    this.sendStateUpdate = _.throttle(this.sendStateUpdate, this.THROTTLE_TIME);
  }

  private sendStateUpdate = () => {
    this.send("download-state-update", this.downloadState);
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
    await this.videoRepository.changeVideoStatus(
      id,
      DownloadStatus.Downloading
    );
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
