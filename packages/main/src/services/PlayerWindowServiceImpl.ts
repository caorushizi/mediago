import { BrowserWindow, BrowserWindowConstructorOptions, Menu } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { PlayerWindowService } from "../interfaces";

@injectable()
export default class PlayerWindowServiceImpl
  extends BrowserWindow
  implements PlayerWindowService
{
  constructor() {
    const options: BrowserWindowConstructorOptions = {
      width: 1100,
      minWidth: 1100,
      height: 680,
      minHeight: 680,
      show: false,
      frame: true,
      webPreferences: {
        preload: resolve(__dirname, "./preload.js"),
      },
    };
    super(options);
  }

  init(): void {
    Menu.setApplicationMenu(null);

    const url = isDev
      ? "http://localhost:8555/player"
      : "mediago://index.html/player";
    void this.loadURL(url);

    this.once("ready-to-show", this.readyToShow);
  }

  readyToShow = () => {
    this.show();
    isDev && this.webContents.openDevTools();
  };
}
