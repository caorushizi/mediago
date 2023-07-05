import { inject, injectable } from "inversify";
import {
  DatabaseService,
  DownloadStatus,
  IpcHandlerService,
  MainWindowService,
  ProtocolService,
  UpdateService,
  VideoRepository,
  WebviewService,
  type App,
  WebService,
  DevToolsService,
  StoreService,
} from "./interfaces";
import { TYPES } from "./types";
import { Menu, Tray, app, nativeImage, nativeTheme } from "electron";
import TrayIcon from "./tray-icon.png";
import path from "path";

@injectable()
export default class ElectronApp implements App {
  constructor(
    @inject(TYPES.MainWindowService)
    private readonly mainWindow: MainWindowService,
    @inject(TYPES.ProtocolService)
    private readonly protocolService: ProtocolService,
    @inject(TYPES.UpdateService)
    private readonly updateService: UpdateService,
    @inject(TYPES.IpcHandlerService)
    private readonly ipcHandler: IpcHandlerService,
    @inject(TYPES.DatabaseService)
    private readonly dataService: DatabaseService,
    @inject(TYPES.WebviewService)
    private readonly webview: WebviewService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.DevToolsService)
    private readonly devTools: DevToolsService,
    @inject(TYPES.WebService)
    private readonly webService: WebService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService
  ) {}

  private async seriveInit(): Promise<void> {
    this.protocolService.create();
    await this.dataService.init();
    this.mainWindow.init();
    this.ipcHandler.init();
    this.updateService.init();
    this.webview.init(), this.devTools.init();
    this.webService.init();
  }

  async init(): Promise<void> {
    await this.seriveInit();

    app.on("activate", () => {
      this.mainWindow.init();
    });

    this.initAppTheme();
    this.resetDownloadStatus();

    this.initTray();
  }

  initAppTheme(): void {
    const theme = this.storeService.get("theme");
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
      { label: "退出 app", role: "quit" },
      { label: "显示主窗口", click: () => this.mainWindow.init() },
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
      DownloadStatus.Failed
    );
  }
}
