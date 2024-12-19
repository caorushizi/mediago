import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import isDev from "electron-is-dev";

export default class Window {
  window: BrowserWindow | null = null;
  options: BrowserWindowConstructorOptions;
  url: string;

  constructor(options: BrowserWindowConstructorOptions) {
    this.options = options;
  }

  create() {
    if (!this.url) {
      throw new Error("url is required");
    }

    const window = new BrowserWindow(this.options);
    void window.loadURL(this.url);

    window.once("ready-to-show", this.readyToShow);
    window.on("close", this.windowClose);

    return window;
  }

  readyToShow = () => {
    if (!this.window) return;

    this.window.show();
    isDev && this.window.webContents.openDevTools();
  };

  windowClose = () => {
    if (!this.window) return;

    // Destruction window
    this.window = null;
  };
}
