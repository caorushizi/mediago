import { provide } from "@inversifyjs/binding-decorators";
import {
  DOWNLOAD_EVENT_NAME,
  type DownloadProgress,
  DownloadProgressEvent,
  DownloadStatus,
  type DownloadSuccessEvent,
  type DownloadTask,
} from "@mediago/shared-common";
import { DownloaderServer, DownloadTaskService, i18n } from "@mediago/shared-node";
import { app, Menu, Notification } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import _ from "lodash";
import Window from "../core/window";
import { preloadUrl } from "../helper";
import { isWin } from "../helper/variables";
import ElectronLogger from "../vendor/ElectronLogger";
import ElectronStore from "../vendor/ElectronStore";

console.log("preloadUrl", preloadUrl);

@injectable()
@provide()
export default class MainWindow extends Window {
  url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
  private initialUrl: string | null = null;

  constructor(
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(DownloadTaskService)
    private readonly downloadTaskService: DownloadTaskService,
    @inject(ElectronStore)
    private readonly store: ElectronStore,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
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
    this.downloaderServer.on("download-success", this.onDownloadSuccess);
    this.downloaderServer.on("download-failed", this.onDownloadFailed);
    this.downloaderServer.on("download-start", this.onDownloadStart);
    this.downloaderServer.on("download-progress", this.onDownloadProgress);
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

  onDownloadProgress = async (tasks: DownloadProgress[]) => {
    const data: DownloadProgressEvent = {
      type: "progress",
      data: tasks,
    };
    this.send(DOWNLOAD_EVENT_NAME, data);
  };

  onDownloadReadyStart = async ({ id, isLive }: DownloadProgress) => {
    if (isLive) {
      await this.downloadTaskService.setIsLive(id, true);
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
    await this.downloadTaskService.setStatus(id, DownloadStatus.Success);
    const video = await this.downloadTaskService.findByIdOrFail(id);

    const promptTone = this.store.get("promptTone");
    if (promptTone) {
      new Notification({
        title: i18n.t("downloadSuccess"),
        body: i18n.t("videoDownloadSuccess", {
          name: video.name,
        }),
      }).show();
    }

    const data: DownloadSuccessEvent = {
      type: "success",
      // FIXME: Type 'Video' is not assignable to type 'DownloadTask'.
      data: video as unknown as DownloadTask,
    };
    this.send(DOWNLOAD_EVENT_NAME, data);
  };

  onDownloadFailed = async (id: number, err: unknown) => {
    this.logger.info(`taskId: ${id} failed`, err);
    await this.downloadTaskService.setStatus(id, DownloadStatus.Failed);

    const promptTone = this.store.get("promptTone");
    if (promptTone) {
      const video = await this.downloadTaskService.findByIdOrFail(id);
      new Notification({
        title: i18n.t("downloadFailed"),
        body: i18n.t("videoDownloadFailed", { name: video.name }),
      }).show();
    }
  };

  onDownloadStart = async (id: number) => {
    this.logger.info(`taskId: ${id} start`);
    await this.downloadTaskService.setStatus(id, DownloadStatus.Downloading);
  };

  onDownloadStop = async (id: number) => {
    this.logger.info(`taskId: ${id} stopped`);
    await this.downloadTaskService.setStatus(id, DownloadStatus.Stopped);
  };

  onDownloadMessage = async (id: number, message: string) => {
    await this.downloadTaskService.appendLog(id, message);
    const showTerminal = this.store.get("showTerminal");
  };

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
