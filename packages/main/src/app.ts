import { app } from "electron";
import { inject, injectable } from "inversify";
import {
  DatabaseService,
  IpcHandlerService,
  MainWindowService,
  ProtocolService,
  UpdateService,
  UserRepository,
  type App,
} from "./interfaces";
import { TYPES } from "./types";

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
    private readonly userRepo: UserRepository
  ) {
    // empty
  }

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

    this.userRepo.init();
  }
}
