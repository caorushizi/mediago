import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { BrowserWindowService } from "../interfaces";
import { resolve } from "path";
import isDev from "electron-is-dev";
import { injectable } from "inversify";

@injectable()
export default class BrowserWindowServiceImpl
  extends BrowserWindow
  implements BrowserWindowService {
  constructor() {
    const options: BrowserWindowConstructorOptions = {
      width: 800,
      height: 600,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: resolve(__dirname, "./preload.js"),
      },
    };
    super(options);
  }

  init() {
    const url = isDev
      ? "http://localhost:8555/browser"
      : "mediago://index.html/browser";

    void this.loadURL(url);
    isDev && this.webContents.openDevTools();
  }
}
