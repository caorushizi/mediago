import { provide } from "@inversifyjs/binding-decorators";
import {
  type ContextMenuItem,
  type Controller,
  IPC,
} from "@mediago/shared-common";
import { handle } from "../core/decorators";
import { TYPES } from "../types/symbols";
import {
  type IpcMainEvent,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
} from "electron";
import { injectable } from "inversify";

@injectable()
@provide(TYPES.Controller)
export default class ContextMenuController implements Controller {
  @handle(IPC.contextMenu.show)
  async show(
    e: IpcMainEvent,
    items: ContextMenuItem[],
  ): Promise<string | null> {
    return new Promise((resolve) => {
      let resolved = false;

      const template: Array<MenuItemConstructorOptions | MenuItem> = items.map(
        (item) => {
          if (item.type === "separator") {
            return { type: "separator" as const };
          }
          return {
            label: item.label,
            click: () => {
              resolved = true;
              resolve(item.key);
            },
          };
        },
      );

      const menu = Menu.buildFromTemplate(template);
      menu.popup({
        callback: () => {
          if (!resolved) resolve(null);
        },
      });
    });
  }
}
