import { handle } from "../utils/ipc";
import { binDir } from "../utils/variables";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { ConfigService, Controller } from "../interfaces";
import { app, IpcMainInvokeEvent } from "electron";

@injectable()
export default class ConfigController implements Controller {
  constructor(@inject(TYPES.ConfigService) private config: ConfigService) {
    console.log(123123);
  }
  @handle("get-bin-dir")
  getBinDir() {
    return binDir;
  }

  @handle("set-store")
  setStore(e: IpcMainInvokeEvent, key: string, value: string) {
    return this.config.set(key, value);
  }

  @handle("get-store")
  getStore(e: IpcMainInvokeEvent, key: string) {
    console.log("yhis.config", this);
    return this.config.get(key);
  }

  @handle("get-path")
  getPath(e: IpcMainInvokeEvent, name: any) {
    return app.getPath(name);
  }
}
