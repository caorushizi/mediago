import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Menu,
  Notification,
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

@injectable()
export default class MainWindowServiceImpl
  extends BrowserWindow
  implements MainWindowService
{
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
    const options: BrowserWindowConstructorOptions = {
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
    super(options);
  }

  init(): void {
    Menu.setApplicationMenu(null);

    const url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
    void this.loadURL(url);

    this.once("ready-to-show", this.readyToShow);
    event.on("download-progress", this.onDownloadProgress);
    this.downloadService.on("download-success", this.onDownloadSuccess);
    this.downloadService.on("download-failed", this.onDownloadFailed);
    this.downloadService.on("download-start", this.onDownloadStart);
    this.downloadService.on("download-stop", this.onDownloadStart);

    this.storeService.onDidAnyChange((store) => {
      // 向所有窗口发送通知
      this.webContents.send("store-change", store);
    });
  }

  readyToShow = () => {
    this.show();
    isDev && this.webContents.openDevTools();
  };

  onDownloadProgress = (progress: DownloadProgress) => {
    this.webContents.send("download-progress", progress);
  };

  onDownloadSuccess = async (id: number) => {
    const promptTone = this.storeService.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);

      new Notification({
        title: "下载成功",
        body: `${video?.name} 下载成功`,
      }).show();
    }

    this.webContents.send("download-success", id);
  };

  onDownloadFailed = async (id: number, err: any) => {
    const promptTone = this.storeService.get("promptTone");
    if (promptTone) {
      const video = await this.videoRepository.findVideo(id);

      new Notification({
        title: "下载失败",
        body: `${video?.name} 下载失败`,
      }).show();
    }
    this.logger.error("下载失败：", err);
    this.webContents.send("download-failed", id);
  };

  onDownloadStart = async (id: number) => {
    this.webContents.send("download-start", id);
  };

  onDownloadStop = async (id: number) => {
    this.webContents.send("download-stop", id);
  };
}
