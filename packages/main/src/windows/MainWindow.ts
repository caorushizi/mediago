import { Menu, Notification, app } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "../types";
import { DownloadProgress } from "../interfaces";
import _ from "lodash";
import Window from "./window";
import LoggerService from "services/LoggerService";
import DownloadService from "services/DownloadService";
import StoreService from "services/StoreService";
import VideoRepository from "repository/videoRepository";

@injectable()
export default class MainWindow extends Window {
  url = isDev ? "http://localhost:8555/" : "mediago://index.html/";
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
    this.downloadService.on("download-stop", this.onDownloadStart);
    this.storeService.onDidAnyChange(this.storeChange);
    app.on("second-instance", this.secondInstance);
  }

  onDownloadReadyStart = ({ id, isLive }: { id: number; isLive: boolean }) => {
    this.videoRepository.changeVideoIsLive(id, isLive);
    this.send("change-video-is-live", { id, isLive });
  };

  init(): void {
    if (this.window) {
      // 如果窗口已经存在，则直接显示
      this.window.show();
      return;
    }

    Menu.setApplicationMenu(null);

    this.window = this.create();

    const mainBounds = this.storeService.get("mainBounds");
    if (mainBounds) {
      this.window.setBounds(mainBounds);
    }

    // 处理当前窗口改变大小
    this.window.on("resized", this.handleResize);
  }

  handleResize = () => {
    if (!this.window) return;

    const bounds = this.window.getBounds();
    this.storeService.set("mainBounds", _.omit(bounds, ["x", "y"]));
  };

  secondInstance = () => {
    if (!this.window) return;
    if (process.platform === "win32") {
      if (this.window) {
        if (this.window.isMinimized()) {
          this.window.restore();
        }
        if (this.window.isVisible()) {
          this.window.focus();
        } else {
          this.window.show();
        }
      }
    }
  };

  storeChange = (store: any) => {
    // 向所有窗口发送通知
    this.send("store-change", store);
  };

  onDownloadProgress = (progress: DownloadProgress) => {
    this.send("download-progress", progress);
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

    this.send("download-success", id);
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
    this.send("download-failed", id);
  };

  onDownloadStart = async (id: number) => {
    this.send("download-start", id);
  };

  onDownloadStop = async (id: number) => {
    this.send("download-stop", id);
  };

  send(channel: string, ...args: any[]) {
    if (!this.window) return;

    this.window.webContents.send(channel, ...args);
  }
}
