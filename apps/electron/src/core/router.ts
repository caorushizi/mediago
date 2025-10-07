import { provide } from "@inversifyjs/binding-decorators";
import type { Controller } from "@mediago/shared-common";
import { registerControllerHandlers, TYPES } from "@mediago/shared-node";
import { ipcMain } from "electron";
import { inject, injectable, multiInject } from "inversify";
import type { MediaGoRouter } from "../types/core";
import ElectronLogger from "../vendor/ElectronLogger";
import { createElectronControllerBinder } from "./electronBinder";

@injectable()
@provide()
export default class ElectronRouter implements MediaGoRouter {
  constructor(
    @multiInject(TYPES.Controller)
    private readonly controllers: Controller[],
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {}

  init(): void {
    const binder = createElectronControllerBinder(ipcMain, this.logger);
    registerControllerHandlers(this.controllers, binder);
  }
}
