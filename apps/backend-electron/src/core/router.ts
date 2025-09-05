import { provide } from "@inversifyjs/binding-decorators";
import { MEDIAGO_EVENT, MEDIAGO_METHOD, type Controller } from "@mediago/shared-common";
import { TYPES } from "@mediago/shared-node";
import { ipcMain } from "electron";
import { inject, injectable, multiInject } from "inversify";
import { error, success } from "../helper/index";
import ElectronLogger from "../vendor/ElectronLogger";
import { MediaGoRouter } from "../types/core";

@injectable()
@provide()
export default class ElectronRouter implements MediaGoRouter {
  constructor(
    @multiInject(TYPES.Controller)
    private readonly controllers: Controller[],
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {}

  private registerIpc(controller: Controller, propertyKey: string | symbol): void {
    const property = controller[propertyKey];
    if (typeof property !== "function") return;

    const channel: string = Reflect.getMetadata(MEDIAGO_EVENT, controller, propertyKey);
    if (!channel) return;

    const ipcMethod: "on" | "handle" = Reflect.getMetadata(MEDIAGO_METHOD, controller, propertyKey);
    if (!ipcMethod) return;

    ipcMain[ipcMethod](channel, async (...args: unknown[]) => {
      try {
        let res = property.call(controller, ...args);
        if (res.then) {
          res = await res;
        }
        return success(res);
      } catch (e: unknown) {
        this.logger.error(`process ipc [${channel}] failed: `, e);
        if (e instanceof Error) {
          return error(e.message);
        } else {
          return error(String(e));
        }
      }
    });
  }

  init(): void {
    for (const controller of this.controllers) {
      const Class = Object.getPrototypeOf(controller);
      Object.getOwnPropertyNames(Class).forEach((propertyKey) => {
        this.registerIpc(controller, propertyKey);
      });
    }
  }
}
