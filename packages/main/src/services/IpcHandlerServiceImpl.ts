import { ipcMain } from "electron";
import { injectable, multiInject } from "inversify";
import { Controller, IpcHandlerService } from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class IpcHandlerServiceImpl implements IpcHandlerService {
  constructor(
    @multiInject(TYPES.Controller) private readonly controllers: Controller[]
  ) {
    // empty
  }

  private registerIpc(controller: Controller, property: string | symbol): void {
    const fun = controller[property];
    const channel: string = Reflect.getMetadata(
      "ipc-channel",
      controller,
      property
    );
    const method: "on" | "handle" = Reflect.getMetadata(
      "ipc-method",
      controller,
      property
    );
    if (typeof fun === "function" && method && channel) {
      ipcMain[method](channel, async (...args: any[]) => {
        try {
          const handler = fun.bind(controller);
          let res = handler(...args);
          if (res.then) {
            res = await res;
          }
          return this.success(res);
        } catch (e: any) {
          return this.error(e.message);
        }
      });
    }
  }

  success(data: any) {
    return {
      code: 0,
      message: "success",
      data,
    };
  }

  error(message = "fail") {
    return {
      code: -1,
      message,
      data: null,
    };
  }

  private bindIpcMethods(controller: Controller): void {
    const Class = Object.getPrototypeOf(controller);
    Object.getOwnPropertyNames(Class).forEach((property) =>
      this.registerIpc(controller, property as never)
    );
  }

  init(): void {
    this.controllers.forEach((controller) => this.bindIpcMethods(controller));
  }
}
