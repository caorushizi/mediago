import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { DownloadStatus } from "@mediago/shared-common";
import { DownloaderServer, i18n, TypeORM, VideoRepository, VideoServer } from "@mediago/shared-node";
import { app, BrowserWindow, type Event, Menu, nativeImage, nativeTheme, Tray } from "electron";
import { inject, injectable } from "inversify";
import TrayIcon from "../assets/tray-icon.png";
import TrayIconLight from "../assets/tray-icon-light.png";
import ProtocolService from "./core/protocol";
import ElectronRouter from "./core/router";
import { db, isMac } from "./helper/variables";
import ElectronDevtools from "./vendor/ElectronDevtools";
import ElectronStore from "./vendor/ElectronStore";
import ElectronUpdater from "./vendor/ElectronUpdater";
import MainWindow from "./windows/main.window";
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
    @inject(VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(ElectronDevtools)
    private readonly devTools: ElectronDevtools,
    @inject(ElectronStore)
    private readonly store: ElectronStore,
    @inject(VideoServer)
    private readonly videoServer: VideoServer,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {}

  private async serviceInit(): Promise<void> {
    this.mainWindow.init();
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

    this.initTray();

    const local = this.store.get("local");
    this.videoServer.start({ local });

    // Start the download service
    this.downloaderServer.start();
    this.store.onDidChange("maxRunner", (maxRunner) => {
      this.downloaderServer.changeConfig({ maxRunner: maxRunner || 1 });
    });
    this.store.onDidChange("proxy", (proxy) => {
      this.downloaderServer.changeConfig({ proxy: proxy || "" });
    });
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
