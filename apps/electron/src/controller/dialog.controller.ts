import { provide } from "@inversifyjs/binding-decorators";
import {
  type Controller,
  type DialogOpenOptions,
  type DialogSaveOptions,
  IPC,
} from "@mediago/shared-common";
import { handle } from "../core/decorators";
import { i18n } from "../core/i18n";
import { TYPES } from "../types/symbols";
import { dialog, type IpcMainEvent } from "electron";
import fs from "node:fs/promises";
import { inject, injectable } from "inversify";
import MainWindow from "../windows/main.window";

@injectable()
@provide(TYPES.Controller)
export default class DialogController implements Controller {
  constructor(
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
  ) {}

  @handle(IPC.dialog.open)
  async open(e: IpcMainEvent, options: DialogOpenOptions): Promise<string[]> {
    const window = this.mainWindow.window;
    if (!window) return Promise.reject(i18n.t("noMainWindow"));

    const properties: Electron.OpenDialogOptions["properties"] =
      options.type === "directory" ? ["openDirectory"] : ["openFile"];
    if (options.multiple) {
      properties.push("multiSelections");
    }

    const result = await dialog.showOpenDialog(window, {
      properties,
      filters: options.filters,
    });

    if (result.canceled) return [];

    // Optionally read file content instead of returning paths
    if (options.readContent && options.type === "file") {
      const contents = await Promise.all(
        result.filePaths.map((p) => fs.readFile(p, "utf-8")),
      );
      return contents;
    }

    return result.filePaths;
  }

  @handle(IPC.dialog.save)
  async save(e: IpcMainEvent, options: DialogSaveOptions): Promise<string> {
    const window = this.mainWindow.window;
    if (!window) return Promise.reject(i18n.t("noMainWindow"));

    const result = await dialog.showSaveDialog(window, {
      defaultPath: options.defaultPath,
      filters: options.filters,
    });

    if (result.canceled || !result.filePath) return "";

    await fs.writeFile(result.filePath, options.content, "utf-8");
    return result.filePath;
  }
}
