import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";

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
    this.window.webContents.openDevTools();
  };

  windowClose = () => {
    if (!this.window) return;

    // 防止 webview 同时被销毁
    this.window.setBrowserView(null);

    // 销毁窗口
    this.window = null;
  };
}
