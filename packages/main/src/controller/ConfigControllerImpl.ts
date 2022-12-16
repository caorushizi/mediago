import { binDir } from "../utils/variables";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ConfigService, Controller } from "../interfaces";
import { app, IpcMainInvokeEvent } from "electron";
import { handle } from "../decorator/ipc";

@injectable()
export default class ConfigControllerImpl implements Controller {
  constructor(@inject(TYPES.ConfigService) private config: ConfigService) {}
  @handle("get-bin-dir")
  getBinDir(): string {
    return binDir;
  }

  @handle("set-store")
  setStore(e: IpcMainInvokeEvent, key: string, value: string): any {
    return this.config.set(key, value);
  }

  @handle("get-store")
  getStore(e: IpcMainInvokeEvent, key: string): any {
    return this.config.get(key);
  }

  @handle("get-path")
  getPath(e: IpcMainInvokeEvent, name: any) {
    return app.getPath(name);
  }
}
