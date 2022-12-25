import { inject, injectable } from "inversify";
import {
  App,
  BrowserViewService,
  BrowserWindowService,
  ConfigService,
  DataService,
  IpcHandlerService,
  MainWindowService,
  ProtocolService,
  UpdateService,
} from "./interfaces";
import { app } from "electron";
import { TYPES } from "./types";

@injectable()
export default class MediaGo implements App {
  constructor(
    @inject(TYPES.BrowserWindowService)
    private readonly browserWindow: BrowserWindowService,
    @inject(TYPES.MainWindowService)
    private readonly mainWindow: MainWindowService,
    @inject(TYPES.BrowserViewService)
    private readonly browserView: BrowserViewService,
    @inject(TYPES.ProtocolService)
    private readonly protocolService: ProtocolService,
    @inject(TYPES.UpdateService)
    private readonly updateService: UpdateService,
    @inject(TYPES.ConfigService)
    private readonly config: ConfigService,
    @inject(TYPES.IpcHandlerService)
    private readonly ipcHandler: IpcHandlerService,
    @inject(TYPES.DataService)
    protected dataServices: DataService
  ) {}

  async init(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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
    this.dataServices.init();
  }
}
