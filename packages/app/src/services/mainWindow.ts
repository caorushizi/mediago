import { BrowserWindow } from "electron";
import { resolve } from "path";
import { inject, injectable } from "inversify";
import { Config, MainWindow } from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class MainWindowImpl
  extends BrowserWindow
  implements MainWindow
{
  constructor(@inject(TYPES.Config) private readonly config: Config) {
    const options: Electron.BrowserWindowConstructorOptions = {
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        preload: resolve(config.get("execDir"), "preload/index.js"),
      },
    };
    super(options);
  }

  async init(): Promise<void> {
    await this.loadURL("http://localhost:5173");
  }
}
