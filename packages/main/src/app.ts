import { inject, injectable } from "inversify";
import { DownloadStatus } from "@mediago/shared/common";
import {
  DownloaderService,
  TaskQueueService,
  TYPES,
} from "@mediago/shared/node";
import {
  Menu,
  Tray,
  app,
  nativeImage,
  nativeTheme,
  Event,
  BrowserWindow,
} from "electron";
import TrayIcon from "../assets/tray-icon.png";
import TrayIconLight from "../assets/tray-icon-light.png";
import path from "path";
import MainWindow from "./windows/MainWindow.ts";
import WebviewService from "./services/WebviewService.ts";
import { VideoRepository } from "@mediago/shared/node";
import ElectronDevtools from "./vendor/ElectronDevtools.ts";
import ElectronStore from "./vendor/ElectronStore.ts";
import ElectronUpdater from "./vendor/ElectronUpdater.ts";
import { TypeORM } from "@mediago/shared/node";
import ProtocolService from "./core/protocol.ts";
import IpcHandlerService from "./core/ipc.ts";
import { VideoService } from "./services/VideoService.ts";
import { i18n } from "@mediago/shared/common";
import { binMap, db, isMac } from "./helper/variables.ts";

@injectable()
export default class ElectronApp {
  constructor(
    @inject(TYPES.MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(TYPES.ProtocolService)
    private readonly protocol: ProtocolService,
    @inject(TYPES.ElectronUpdater)
    private readonly updater: ElectronUpdater,
    @inject(TYPES.IpcHandlerService)
    private readonly ipc: IpcHandlerService,
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
    @inject(TYPES.WebviewService)
    private readonly webview: WebviewService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.ElectronDevtools)
    private readonly devTools: ElectronDevtools,
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore,
    @inject(TYPES.VideoService)
    private readonly videoService: VideoService,
    @inject(TYPES.TaskQueueService)
    private readonly taskQueue: TaskQueueService,
    @inject(TYPES.DownloaderService)
    private readonly downloader: DownloaderService
  ) {}

  private async serviceInit(): Promise<void> {
    this.mainWindow.init();
    this.videoService.init();
  }

  private async vendorInit() {
    await this.db.init({ dbPath: db });
    this.updater.init();
    this.devTools.init();
  }

  async init(): Promise<void> {
    this.protocol.create();
    this.ipc.init();

    // vendor
    await this.vendorInit();
    // service
    await this.serviceInit();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow.init();
      }
    });

    this.initAppTheme();
    this.initLanguage();
    this.resetDownloadStatus();

    // 初始化下载器
    this.downloader.init(binMap);

    // 初始化任务队列
    this.taskQueue.init({
      maxRunner: this.store.get("maxRunner"),
      proxy: this.store.get("proxy"),
    });

    this.store.onDidChange("maxRunner", (maxRunner) => {
      this.taskQueue.changeMaxRunner(maxRunner || 2);
    });

    this.store.onDidChange("proxy", (proxy) => {
      this.taskQueue.changeProxy(proxy || "");
    });

    this.initTray();
  }

  initAppTheme(): void {
    const theme = this.store.get("theme");
    nativeTheme.themeSource = theme;
  }

  initLanguage(): void {
    const language = this.store.get("language");
    i18n.changeLanguage(language);
  }

  initTray() {
    const iconPath = path.resolve(__dirname, isMac ? TrayIconLight : TrayIcon);
    const icon = nativeImage.createFromPath(iconPath);
    const tray = new Tray(icon);
    tray.setToolTip("Media Go");
    tray.addListener("click", () => {
      this.mainWindow.init();
    });
    const contextMenu = Menu.buildFromTemplate([
      {
        label: i18n.t("showMainWindow"),
        click: () => this.mainWindow.init(),
      },
      {
        label: i18n.t("exitApp"),
        role: "quit",
      },
    ]);
    tray.setContextMenu(contextMenu);
  }

  // If there are still videos being downloaded after the restart, change the status to download failed
  async resetDownloadStatus(): Promise<void> {
    // If data in the downloading state still fails after the restart, all downloads fail
    const videos = await this.videoRepository.findWattingAndDownloadingVideos();
    const videoIds = videos.map((video) => video.id);
    await this.videoRepository.changeVideoStatus(
      videoIds,
      DownloadStatus.Failed
    );
  }

  secondInstance = (event: Event, commandLine: string[]) => {
    const url = commandLine.pop() || "";
    this.mainWindow.showWindow(url);
  };

  handleOpenUrl(url: string): void {
    this.mainWindow.handleUrl(url);
  }

  send(url: string): void {
    this.mainWindow.send("url-params", url);
  }
}
