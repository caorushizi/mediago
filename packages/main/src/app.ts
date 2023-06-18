import { inject, injectable } from "inversify";
import {
  DatabaseService,
  DownloadStatus,
  IpcHandlerService,
  MainWindowService,
  ProtocolService,
  StoreService,
  UpdateService,
  VideoRepository,
  WebviewService,
  type App,
  WebService,
  DevToolsService,
} from "./interfaces";
import { TYPES } from "./types";
import { app } from "electron";

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
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.DevToolsService)
    private readonly devTools: DevToolsService,
    @inject(TYPES.WebService)
    private readonly webService: WebService
  ) {}

  async init(): Promise<void> {
    this.protocolService.create();
    this.mainWindow.init();
    this.ipcHandler.init();
    this.updateService.init();
    this.webview.init();
    this.storeService.init();
    this.devTools.init();
    await this.dataService.init();
    this.webService.init();

    app.on("activate", () => {
      this.mainWindow.init();
    });

    this.resetDownloadStatus();
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
