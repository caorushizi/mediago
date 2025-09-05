import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { DownloadStatus, i18n } from "@mediago/shared-common";
import { DownloaderService, TaskQueueService, TypeORM, VideoRepository } from "@mediago/shared-node";
import { app, BrowserWindow, type Event, Menu, nativeImage, nativeTheme, Tray } from "electron";
import { inject, injectable } from "inversify";
import TrayIcon from "../assets/tray-icon.png";
import TrayIconLight from "../assets/tray-icon-light.png";
import ElectronRouter from "./core/router";
import ProtocolService from "./core/protocol";
import { ptyRunner } from "./helper/ptyRunner";
import { binMap, db, isMac } from "./helper/variables";
import { VideoService } from "./services/VideoService";
import WebviewService from "./services/WebviewService";
import ElectronDevtools from "./vendor/ElectronDevtools";
import ElectronStore from "./vendor/ElectronStore";
import ElectronUpdater from "./vendor/ElectronUpdater";
import MainWindow from "./windows/MainWindow";
import "./controller";

@injectable()
@provide()
export default class ElectronApp {
  constructor(
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(ProtocolService)
    private readonly protocol: ProtocolService,
    @inject(ElectronUpdater)
    private readonly updater: ElectronUpdater,
    @inject(ElectronRouter)
    private readonly router: ElectronRouter,
    @inject(TypeORM)
    private readonly db: TypeORM,
    @inject(WebviewService)
    private readonly webview: WebviewService,
    @inject(VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(ElectronDevtools)
    private readonly devTools: ElectronDevtools,
    @inject(ElectronStore)
    private readonly store: ElectronStore,
    @inject(VideoService)
    private readonly videoService: VideoService,
    @inject(TaskQueueService)
    private readonly taskQueue: TaskQueueService,
    @inject(DownloaderService)
    private readonly downloader: DownloaderService,
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
    this.router.init();

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
    this.downloader.init(binMap, ptyRunner);

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
    await this.videoRepository.changeVideoStatus(videoIds, DownloadStatus.Failed);
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
