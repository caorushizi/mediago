import { inject, injectable } from "inversify";
import { DownloadStatus } from "./interfaces";
import { TYPES } from "./types";
import { Menu, Tray, app, nativeImage, nativeTheme } from "electron";
import TrayIcon from "./tray-icon.png";
import path from "path";
import MainWindow from "./windows/MainWindow";
import WebviewService from "./services/WebviewService";
import VideoRepository from "./repository/VideoRepository";
import ElectronDevtools from "./vendor/ElectronDevtools";
import ElectronStore from "./vendor/ElectronStore";
import ElectronUpdater from "./vendor/ElectronUpdater";
import TypeORM from "./vendor/TypeORM";
import ProtocolService from "./core/protocol";
import IpcHandlerService from "./core/ipc";

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
  ) {}

  private async serviceInit(): Promise<void> {
    this.mainWindow.init();
    this.webview.init();
  }

  private async vendorInit() {
    await this.db.init();
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
      this.mainWindow.init();
    });

    this.initAppTheme();
    this.resetDownloadStatus();

    this.initTray();
  }

  initAppTheme(): void {
    const theme = this.store.get("theme");
    nativeTheme.themeSource = theme;
  }

  initTray() {
    const iconPath = path.resolve(__dirname, TrayIcon);
    const icon = nativeImage.createFromPath(iconPath);
    const tray = new Tray(icon);
    tray.setToolTip("在线视频下载");
    tray.addListener("click", () => {
      this.mainWindow.init();
    });
    const contextMenu = Menu.buildFromTemplate([
      { label: "显示主窗口", click: () => this.mainWindow.init() },
      { label: "退出 app", role: "quit" },
    ]);
    tray.setContextMenu(contextMenu);
  }

  // 如果重启后还有正在下载的视频，就将状态改成下载失败
  async resetDownloadStatus(): Promise<void> {
    // 重启后如果还有 downloading 状态的数据， 全部重置为失败
    const videos = await this.videoRepository.findWattingAndDownloadingVideos();
    const videoIds = videos.map((video) => video.id);
    await this.videoRepository.changeVideoStatus(
      videoIds,
      DownloadStatus.Failed,
    );
  }
}
