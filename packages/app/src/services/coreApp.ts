import { inject, injectable } from "inversify";
import { app, BrowserWindow, ipcMain } from "electron";
import TYPES from "../types";
import {
  Browser,
  Config,
  DB,
  MainWindow,
  MyApp,
  InnerBrowser,
} from "../interfaces";
import { GET_VIDEO_LIST } from "../channels";

@injectable()
export default class CoreApp implements MyApp {
  constructor(
    @inject(TYPES.DB) private readonly db: DB,
    @inject(TYPES.MainWindow) private readonly mainWindow: MainWindow,
    @inject(TYPES.Browser) private readonly browser: Browser,
    @inject(TYPES.Config) private readonly config: Config,
    @inject(TYPES.InnerBrowser) private readonly browserView: InnerBrowser
  ) {
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow
          .init()
          .then((r) => r)
          .catch((e) => e);
      }
    });
  }

  async init(): Promise<void> {
    await Promise.all([this.db.init()]);
    this.mainWindow.show();
    this.browser.show();
    this.config.init();
    await this.mainWindow.init();
    await this.browser.init();

    console.log("this.browserView", this.browserView);
    this.browser.setBrowserView(this.browserView);
    await this.browserView.initView(123);
    this.browserView.setBounds({ x: 100, y: 100, width: 500, height: 500 });
    await this.browserView.webContents.loadURL("https://www.qpgyb.com/");

    ipcMain.on("change-window-size", (e, args) => {
      this.browserView.setBounds({
        x: 50,
        y: 30,
        height: args.height,
        width: args.width,
      });
    });

    ipcMain.handle(GET_VIDEO_LIST, () => {
      console.log("123123");

      return [];
    });
  }
}
