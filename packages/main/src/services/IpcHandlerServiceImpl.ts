import { Controller, IpcHandlerService } from "../interfaces";
import { injectable, multiInject } from "inversify";
import { TYPES } from "../types";
import { ipcMain } from "electron";

@injectable()
export default class IpcHandlerServiceImpl implements IpcHandlerService {
  constructor(
    @multiInject(TYPES.Controller) private readonly controllers: Controller[]
  ) {}

  private registerIpc(controller: Controller, property: string | symbol) {
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
      ipcMain[method](channel, fun.bind(controller));
    }
  }

  private bindIpcMethods(controller: Controller) {
    const Class = Object.getPrototypeOf(controller);
    Object.getOwnPropertyNames(Class).forEach((property) =>
      this.registerIpc(controller, property as never)
    );
  }

  init(): void {
    this.controllers.forEach((controller) => this.bindIpcMethods(controller));
  }
}
