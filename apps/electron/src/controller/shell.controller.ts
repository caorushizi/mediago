import { provide } from "@inversifyjs/binding-decorators";
import { type Controller, IPC } from "@mediago/shared-common";
import { handle } from "../core/decorators";
import { TYPES } from "../types/symbols";
import { type IpcMainEvent, shell } from "electron";
import { injectable } from "inversify";

@injectable()
@provide(TYPES.Controller)
export default class ShellController implements Controller {
  @handle(IPC.shell.open)
  async open(e: IpcMainEvent, target: string): Promise<void> {
    // URL → openExternal, path → openPath
    if (/^https?:\/\//i.test(target)) {
      await shell.openExternal(target);
    } else {
      await shell.openPath(target);
    }
  }
}
