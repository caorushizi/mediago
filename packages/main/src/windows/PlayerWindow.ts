import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import { resolve } from "path";
import { TYPES } from "@mediago/shared/node";
import _ from "lodash";
import Window from "../core/window.ts";
import ElectronStore from "../vendor/ElectronStore.ts";

@injectable()
export default class BrowserWindow extends Window {
  url = isDev ? "http://localhost:8555/player" : "mediago://index.html/player";

  constructor(
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore
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

  storeChange = (store: unknown) => {
    this.send("store-change", store);
  };

  handleNewWindowsVal = (newValue: unknown) => {
    if (!this.window) return;

    // Send notifications to all Windows
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
  };

  hideWindow = () => {
    if (!this.window) return;

    this.window.close();
  };

  send(channel: string, ...args: unknown[]) {
    if (!this.window) return;

    this.window.webContents.send(channel, ...args);
  }
}
