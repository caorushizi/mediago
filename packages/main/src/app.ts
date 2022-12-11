import { inject, injectable } from "inversify";
import {
  App,
  BrowserViewService,
  BrowserWindowService,
  ConfigService,
  MainWindowService,
  ProtocolService,
  UpdateService,
} from "./interfaces";
import { app } from "electron";
import { TYPES } from "./types";
import IpcHandlerServiceImpl from "./services/IpcHandlerServiceImpl";

@injectable()
export default class MediaGo implements App {
  constructor(
    @inject(TYPES.BrowserWindowService)
    private browserWindow: BrowserWindowService,
    @inject(TYPES.MainWindowService)
    private mainWindow: MainWindowService,
    @inject(TYPES.BrowserViewService)
    private browserView: BrowserViewService,
    @inject(TYPES.ProtocolService)
    private protocolService: ProtocolService,
    @inject(TYPES.UpdateService)
    private updateService: UpdateService,
    @inject(TYPES.ConfigService)
    private config: ConfigService,
    @inject(TYPES.IpcHandlerService)
    private ipcHandler: IpcHandlerServiceImpl
  ) {}

  async init(): Promise<void> {
    if (require("electron-squirrel-startup")) {
      app.quit();
    }

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        app.quit();
      }
    });

    this.mainWindow.init();
    this.browserWindow.init();
    this.browserView.init();
    this.ipcHandler.init();

    this.protocolService.create();
    this.updateService.init();
  }
}
