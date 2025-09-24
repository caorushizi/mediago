import { provide } from "@inversifyjs/binding-decorators";
import { type Controller } from "@mediago/shared-common";
import { TYPES, registerControllerHandlers } from "@mediago/shared-node";
import { createRequire } from "node:module";
import { inject, injectable, multiInject } from "inversify";
import ElectronLogger from "../vendor/ElectronLogger";
import { MediaGoRouter } from "../types/core";
import { createElectronControllerBinder, type IpcMainHandlers } from "./electronBinder";

type IpcMainHandlers = {
  handle: (channel: string, listener: (...args: unknown[]) => unknown) => void;
  on: (channel: string, listener: (...args: unknown[]) => unknown) => void;
};

const require = createRequire(import.meta.url);
let cachedIpcMain: IpcMainHandlers | undefined;

@injectable()
@provide()
export default class ElectronRouter implements MediaGoRouter {
  constructor(
    @multiInject(TYPES.Controller)
    private readonly controllers: Controller[],
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {}

  protected getIpcMain(): IpcMainHandlers {
    if (!cachedIpcMain) {
      const electron = require("electron") as { ipcMain: IpcMainHandlers };
      cachedIpcMain = electron.ipcMain;
    }
    return cachedIpcMain;
  }

  init(): void {
    const binder = createElectronControllerBinder(this.getIpcMain(), this.logger);
    registerControllerHandlers(this.controllers, binder);
  }
}
