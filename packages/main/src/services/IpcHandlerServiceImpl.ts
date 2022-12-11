import { Controller, IpcHandlerService } from "../interfaces";
import { inject, injectable, multiInject } from "inversify";
import { TYPES } from "../types";
import { ipcMain } from "electron";

@injectable()
export default class IpcHandlerServiceImpl implements IpcHandlerService {
  constructor(
    @multiInject(TYPES.Controller) private controllers: Controller[]
  ) {}
  init(): void {
    for (const controller of this.controllers) {
      for (const method of Object.getOwnPropertyNames(controller)) {
        // @ts-ignore
        const fun = controller[method];
        if (typeof fun === "function") {
          const ipcChannel = Reflect.getMetadata(
            "ipc-channel",
            // @ts-ignore
            controller.__proto__,
            method
          );
          const ipcMethod = Reflect.getMetadata(
            "ipc-method",
            // @ts-ignore
            controller.__proto__,
            method
          );
          if (ipcMethod && ipcChannel) {
            if (ipcChannel && ipcMethod) {
              // @ts-ignore
              ipcMain[ipcMethod](ipcChannel, fun.bind(controller.__proto__));
            }
          }
        }
      }
    }
  }
}
