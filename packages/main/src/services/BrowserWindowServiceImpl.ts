import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "../types";
import { BrowserWindowService, StoreService } from "../interfaces";
import _ from "lodash";

@injectable()
export default class BrowserWindowServiceImpl implements BrowserWindowService {
  window: BrowserWindow | null = null;
  private options: BrowserWindowConstructorOptions;

  constructor(
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService
  ) {
    this.options = {
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
  }

  get show() {
    return !!this.window && !this.window.isDestroyed();
  }

  private create() {
    const window = new BrowserWindow(this.options);

    const url = isDev
      ? "http://localhost:8555/browser"
      : "mediago://index.html/browser";
    void window.loadURL(url);
    this.storeService.onDidChange("openInNewWindow", this.handleNewWindowsVal);
    window.on("resized", this.handleResize);
    window.on("close", this.windowClose);
    return window;
  }

  windowClose = () => {
    if (!this.window) return;

    // 防止 webview 同时被销毁
    this.window.setBrowserView(null);
  };

  handleNewWindowsVal = (newValue: any) => {
    if (!this.window) return;

    // 向所有窗口发送通知
    if (newValue === false) {
      if (this.window && !this.window.isDestroyed()) {
        this.window.close();
      }
    }
  };

  handleResize = () => {
    if (!this.window) return;

    const bounds = this.window.getBounds();
    this.storeService.set("browserBounds", _.omit(bounds, ["x", "y"]));
  };

  showWindow = () => {
    if (!this.window || this.window.isDestroyed()) {
      this.window = this.create();
    }

    this.window.show();
    isDev && this.window.webContents.openDevTools();

    const browserBounds = this.storeService.get("browserBounds");
    if (browserBounds) {
      this.window.setBounds(browserBounds);
    }
  };

  hideWindow = () => {
    if (!this.window) return;

    this.window.close();
  };
}
