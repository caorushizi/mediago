import { app, session } from "electron";
import { inject, injectable } from "inversify";
import {
  DatabaseService,
  IpcHandlerService,
  LoggerService,
  MainWindowService,
  ProtocolService,
  StoreService,
  UpdateService,
  UserRepository,
  WebviewService,
  type App,
} from "./interfaces";
import { TYPES } from "./types";
import isDev from "electron-is-dev";
import installExtension, {
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

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
    @inject(TYPES.UserRepository)
    private readonly userRepo: UserRepository,
    @inject(TYPES.WebviewService)
    private readonly webview: WebviewService,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService
  ) {}

  async init(): Promise<void> {
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    this.protocolService.create();
    await this.mainWindow.init();
    this.ipcHandler.init();
    this.updateService.init();
    await this.dataService.init();
    this.webview.init();
    this.storeService.init();

    if (isDev) {
      try {
        installExtension(REDUX_DEVTOOLS);
        installExtension(REACT_DEVELOPER_TOOLS);
      } catch (e) {
        this.logger.debug("加载插件出错", e);
      }
    }
  }
}
