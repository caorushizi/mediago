import isDev from "electron-is-dev";
import { injectable } from "inversify";
import { resolve } from "path";
import Window from "../core/window";

@injectable()
export default class PlayerWindowServiceImpl extends Window {
  url = isDev ? "http://localhost:8555/player" : "mediago://index.html/player";

  constructor() {
    super({
      width: 1100,
      minWidth: 1100,
      height: 680,
      minHeight: 680,
      show: false,
      frame: true,
      webPreferences: {
        preload: resolve(__dirname, "./preload.js"),
      },
    });
  }

  openWindow = async (name: string) => {
    if (!this.window) {
      const url = new URL(this.url);
      url.searchParams.set("name", encodeURIComponent(name));
      this.url = url.toString();
      this.window = this.create();
    }

    isDev && this.window.webContents.openDevTools();
    this.window.show();
  };
}
