import { Menu, Notification, app } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "../types.ts";
import { DownloadProgress } from "../interfaces.ts";
import _ from "lodash";
import Window from "../core/window.ts";
import ElectronLogger from "../vendor/ElectronLogger.ts";
import DownloadService from "../services/DownloadService.ts";
import ElectronStore from "../vendor/ElectronStore.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import i18n from "../i18n/index.ts";
import { isWin } from "../helper/variables.ts";

@injectable()
export default class MainWindow extends Window {
  url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
  private initialUrl: string | null = null;
  constructor(
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(TYPES.DownloadService)
    private readonly downloadService: DownloadService,
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

    this.downloadService.on("download-ready-start", this.onDownloadReadyStart);
    this.downloadService.on("download-progress", this.onDownloadProgress);
    this.downloadService.on("download-success", this.onDownloadSuccess);
    this.downloadService.on("download-failed", this.onDownloadFailed);
    this.downloadService.on("download-start", this.onDownloadStart);
    this.downloadService.on("download-stop", this.onDownloadStop);
    this.downloadService.on("download-message", this.receiveMessage);
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
      this.send("change-video-is-live", { id });
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
    this.send("download-progress", progress);
  };

  onDownloadSuccess = async (id: number) => {
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

    this.send("download-success", id);
  };

  onDownloadFailed = async (id: number, err: unknown) => {
    const promptTone = this.store.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);

      new Notification({
        title: i18n.t("downloadFailed"),
        body: i18n.t("videoDownloadFailed", { name: video.name }),
      }).show();
    }
    this.logger.error("download failed: ", err);
    this.send("download-failed", id);
  };

  onDownloadStart = async (id: number) => {
    this.send("download-start", id);
  };

  onDownloadStop = async (id: number) => {
    this.send("download-stop", id);
  };

  receiveMessage = async (id: number, message: string) => {
    // Write the log to the database
    await this.videoRepository.appendDownloadLog(id, message);
    const showTerminal = this.store.get("showTerminal");
    if (showTerminal) {
      this.send("download-message", id, message);
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
