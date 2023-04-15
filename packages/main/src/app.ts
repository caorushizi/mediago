import { app } from "electron";
import { inject, injectable } from "inversify";
import {
  BrowserWindowService,
  DatabaseService,
  DownloadStatus,
  IpcHandlerService,
  LoggerService,
  MainWindowService,
  ProtocolService,
  StoreService,
  UpdateService,
  VideoRepository,
  WebviewService,
  type App,
} from "./interfaces";
import { TYPES } from "./types";
import installExtension, {
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import isDev from "electron-is-dev";

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
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.BrowserWindowService)
    private readonly browserWindow: BrowserWindowService
  ) {}

  async init(): Promise<void> {
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    this.protocolService.create();
    this.mainWindow.init();
    this.browserWindow.init();
    this.ipcHandler.init();
    this.updateService.init();
    await this.dataService.init();
    this.webview.init();
    this.storeService.init();

    // 重启后如果还有 downloading 状态的数据， 全部重置为失败
    const videos = await this.videoRepository.findWattingAndDownloadingVideos();
    const videoIds = videos.map((video) => video.id);
    await this.videoRepository.changeVideoStatus(
      videoIds,
      DownloadStatus.Failed
    );

    if (isDev) {
      installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log("An error occurred: ", err));
    }
  }
}
