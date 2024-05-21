import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "../types";
import _ from "lodash";
import Window from "../core/window";
import ElectronStore from "../vendor/ElectronStore";

@injectable()
export default class BrowserWindow extends Window {
  url = isDev
    ? "http://localhost:8555/browser"
    : "mediago://index.html/browser";

  constructor(
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore,
  ) {
    super({
      width: 1100,
      minWidth: 414,
      height: 680,
      minHeight: 680,
      show: false,
      frame: true,
      webPreferences: {
        preload: resolve(__dirname, "./preload.js"),
      },
    });

    this.store.onDidChange("openInNewWindow", this.handleNewWindowsVal);
    this.store.onDidAnyChange(this.storeChange);
  }

  storeChange = (store: any) => {
    this.send("store-change", store);
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
    this.store.set("browserBounds", _.omit(bounds, ["x", "y"]));
  };

  showWindow = () => {
    if (!this.window) {
      this.window = this.create();
      this.window.on("resized", this.handleResize);
    }

    this.window.show();
    isDev && this.window.webContents.openDevTools();

    const browserBounds = this.store.get("browserBounds");
    if (browserBounds) {
      this.window.setBounds(browserBounds);
    }
  };

  hideWindow = () => {
    if (!this.window) return;

    this.window.close();
  };

  send(channel: string, ...args: any[]) {
    if (!this.window) return;

    this.window.webContents.send(channel, ...args);
  }
}
