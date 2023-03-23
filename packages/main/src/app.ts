import { app, session } from "electron";
import { inject, injectable } from "inversify";
import {
  DatabaseService,
  IpcHandlerService,
  LoggerService,
  MainWindowService,
  ProtocolService,
  UpdateService,
  UserRepository,
  WebviewService,
  type App,
} from "./interfaces";
import { TYPES } from "./types";
import isDev from "electron-is-dev";
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
    @inject(TYPES.UserRepository)
    private readonly userRepo: UserRepository,
    @inject(TYPES.WebviewService)
    private readonly webview: WebviewService,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService
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

    if (isDev) {
      try {
        await session.defaultSession.loadExtension(
          path.resolve(__dirname, "../../extensions/react-dev-tool")
        );
        await session.defaultSession.loadExtension(
          path.resolve(__dirname, "../../extensions/redux-dev-tool")
        );
      } catch (e) {
        this.logger.debug("加载插件出错");
      }
    }
  }
}
