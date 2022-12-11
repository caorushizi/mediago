import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { MainWindowService } from "../interfaces";
import { resolve } from "path";
import isDev from "electron-is-dev";
import { injectable } from "inversify";

@injectable()
export default class MainWindowServiceImpl
  extends BrowserWindow
  implements MainWindowService {
  constructor() {
    const options: BrowserWindowConstructorOptions = {
      width: 800,
      minWidth: 800,
      height: 600,
      minHeight: 600,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: resolve(__dirname, "./preload.js"),
      },
      x: -1073,
      y: 240,
    };
    super(options);
  }

  init() {
    const url = isDev
      ? "http://localhost:8555/main"
      : "mediago://index.html/main";
    void this.loadURL(url);

    isDev && this.webContents.openDevTools();

    this.once("ready-to-show", () => {
      this.show();
    });
  }
}
