import { provide } from "@inversifyjs/binding-decorators";
import { type DownloadProgress, DownloadStatus } from "@mediago/shared-common";
import { i18n, VideoRepository } from "@mediago/shared-node";
import { app, Menu, Notification } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import _ from "lodash";
import Window from "../core/window";
import { preloadUrl } from "../helper";
import { isWin } from "../helper/variables";
import ElectronLogger from "../vendor/ElectronLogger";
import ElectronStore from "../vendor/ElectronStore";

@injectable()
@provide()
export default class MainWindow extends Window {
  url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
  private initialUrl: string | null = null;

  constructor(
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
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
        preload: preloadUrl,
      },
    });

    // this.taskQueue.on("download-ready-start", this.onDownloadReadyStart);
    // this.taskQueue.on("download-success", this.onDownloadSuccess);
    // this.taskQueue.on("download-failed", this.onDownloadFailed);
    // this.taskQueue.on("download-start", this.onDownloadStart);
    // this.taskQueue.on("download-stop", this.onDownloadStop);
    // this.taskQueue.on("download-message", this.onDownloadMessage);
    this.store.onDidAnyChange(this.storeChange);
  }

  closeMainWindow = () => {
    const { closeMainWindow } = this.store.store;
    if (closeMainWindow) {
      app.quit();
    }
  };

  onDownloadReadyStart = async ({ id, isLive }: DownloadProgress) => {
    if (isLive) {
      await this.videoRepository.changeVideoIsLive(id);
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

  onDownloadSuccess = async (id: number) => {
    this.logger.info(`taskId: ${id} success`);
    await this.videoRepository.changeVideoStatus(id, DownloadStatus.Success);

    const promptTone = this.store.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);

      new Notification({
        title: i18n.t("downloadSuccess"),
        body: i18n.t("videoDownloadSuccess", {
          name: video.name,
        }),
      }).show();
    }
  };

  onDownloadFailed = async (id: number, err: unknown) => {
    this.logger.info(`taskId: ${id} failed`, err);
    await this.videoRepository.changeVideoStatus(id, DownloadStatus.Failed);

    const promptTone = this.store.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);
      new Notification({
        title: i18n.t("downloadFailed"),
        body: i18n.t("videoDownloadFailed", { name: video.name }),
      }).show();
    }
  };

  onDownloadStart = async (id: number) => {
    this.logger.info(`taskId: ${id} start`);
    await this.videoRepository.changeVideoStatus(id, DownloadStatus.Downloading);
  };

  onDownloadStop = async (id: number) => {
    this.logger.info(`taskId: ${id} stopped`);
    await this.videoRepository.changeVideoStatus(id, DownloadStatus.Stopped);
  };

  onDownloadMessage = async (id: number, message: string) => {
    await this.videoRepository.appendDownloadLog(id, message);
    const showTerminal = this.store.get("showTerminal");
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
