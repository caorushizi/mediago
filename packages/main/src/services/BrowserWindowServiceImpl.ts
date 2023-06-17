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
import _ from "lodash";

@injectable()
export default class BrowserWindowServiceImpl implements BrowserWindowService {
  window: BrowserWindow | null = null;
  private options: BrowserWindowConstructorOptions;

  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
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

    this.storeService.onDidChange("openInNewWindow", (newValue) => {
      // 向所有窗口发送通知
      if (newValue === false) {
        if (window && !window.isDestroyed()) {
          window.close();
        }
      }
    });

    window.on("resized", this.handleResize);

    return window;
  }

  handleResize = () => {
    if (!this.window) return;

    const bounds = this.window.getBounds();
    this.storeService.set("browserBounds", _.omit(bounds, ["x", "y"]));
  };

  showWindow = (store: BrowserStore) => {
    if (!this.window || this.window.isDestroyed()) {
      this.window = this.create();
    }

    this.window.webContents.send("browser-window-store", store);
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
