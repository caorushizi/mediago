import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Event,
} from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "../types";
import {
  BrowserWindowService,
  LoggerService,
  StoreService,
} from "../interfaces";
import { BrowserStore } from "main";

@injectable()
export default class BrowserWindowServiceImpl
  extends BrowserWindow
  implements BrowserWindowService
{
  private ready = false;

  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService
  ) {
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
    const url = isDev
      ? "http://localhost:8555/browser"
      : "mediago://index.html/browser";
    void this.loadURL(url);

    this.once("ready-to-show", this.readyToShow);
    this.on("close", (e: Event) => {
      e.preventDefault();
      this.hideWindow();
    });

    this.storeService.onDidChange("openInNewWindow", (newValue) => {
      // 向所有窗口发送通知
      if (newValue === false) {
        this.hideWindow();
      }
    });
  }

  readyToShow = () => {
    this.ready = true;
  };

  showWindow = (store: BrowserStore) => {
    if (!this.ready) {
      this.logger.error("BrowserWindow is not ready to show.");
      return;
    }

    this.webContents.send("browser-window-store", store);
    this.show();
    isDev && this.webContents.openDevTools();
  };

  hideWindow = () => {
    this.hide();

    // 关闭开发者工具
    if (isDev) {
      this.webContents.closeDevTools();
      this.getBrowserView()?.webContents.closeDevTools();
    }
  };
}
