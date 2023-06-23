import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Menu,
  Notification,
  app,
} from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "../types";
import {
  DownloadProgress,
  DownloadService,
  LoggerService,
  MainWindowService,
  StoreService,
  VideoRepository,
} from "../interfaces";
import { event } from "helper/utils";
import _ from "lodash";

@injectable()
export default class MainWindowServiceImpl implements MainWindowService {
  private readonly options: BrowserWindowConstructorOptions;

  window: BrowserWindow | null = null;

  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.DownloadService)
    private readonly downloadService: DownloadService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService
  ) {
    this.options = {
      width: 1100,
      minWidth: 1100,
      height: 680,
      minHeight: 680,
      show: false,
      frame: true,
      webPreferences: {
        preload: resolve(__dirname, "./preload.js"),
      },
    };
  }

  create(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    const window = new BrowserWindow(this.options);
    const url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
    void window.loadURL(url);

    window.once("ready-to-show", this.readyToShow);
    event.on("download-progress", this.onDownloadProgress);
    this.downloadService.on("download-success", this.onDownloadSuccess);
    this.downloadService.on("download-failed", this.onDownloadFailed);
    this.downloadService.on("download-start", this.onDownloadStart);
    this.downloadService.on("download-stop", this.onDownloadStart);

    this.storeService.onDidAnyChange((store) => {
      // 向所有窗口发送通知
      window.webContents.send("store-change", store);
    });

    // 处理当前窗口改变大小
    window.on("resized", this.handleResize);

    app.on("second-instance", () => {
      if (process.platform === "win32") {
        if (window) {
          if (window.isMinimized()) {
            window.restore();
          }
          if (window.isVisible()) {
            window.focus();
          } else {
            window.show();
          }
        }
      }
    });

    return window;
  }

  get show() {
    return !!this.window && !this.window.isDestroyed();
  }

  init(): void {
    Menu.setApplicationMenu(null);

    this.window = this.create();
  }

  handleResize = () => {
    if (!this.window) return;

    const bounds = this.window.getBounds();
    this.storeService.set("mainBounds", _.omit(bounds, ["x", "y"]));
  };

  readyToShow = () => {
    if (!this.window) return;

    this.window.show();
    isDev && this.window.webContents.openDevTools();

    const mainBounds = this.storeService.get("mainBounds");
    if (mainBounds) {
      this.window.setBounds(mainBounds);
    }
  };

  onDownloadProgress = (progress: DownloadProgress) => {
    if (!this.window) return;

    this.window.webContents.send("download-progress", progress);
  };

  onDownloadSuccess = async (id: number) => {
    if (!this.window) return;

    const promptTone = this.storeService.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);

      new Notification({
        title: "下载成功",
        body: `${video?.name} 下载成功`,
      }).show();
    }

    this.window.webContents.send("download-success", id);
  };

  onDownloadFailed = async (id: number, err: any) => {
    if (!this.window) return;

    const promptTone = this.storeService.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);

      new Notification({
        title: "下载失败",
        body: `${video?.name} 下载失败`,
      }).show();
    }
    this.logger.error("下载失败：", err);
    this.window.webContents.send("download-failed", id);
  };

  onDownloadStart = async (id: number) => {
    if (!this.window) return;

    this.window.webContents.send("download-start", id);
  };

  onDownloadStop = async (id: number) => {
    if (!this.window) return;

    this.window.webContents.send("download-stop", id);
  };
}
