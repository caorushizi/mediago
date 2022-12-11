import { inject, injectable } from "inversify";
import { app, IpcMainInvokeEvent } from "electron";
import { TYPES } from "../types";
import {
  BrowserWindowService,
  Controller,
  MainWindowService,
} from "../interfaces";
import { handle, on } from "../decorator/ipc";

@injectable()
export default class WindowControllerImpl implements Controller {
  constructor(
    @inject(TYPES.BrowserWindowService)
    private browserWindow: BrowserWindowService,
    @inject(TYPES.MainWindowService)
    private mainWindow: MainWindowService
  ) {}
  @on("close-main-window")
  closeMainWindow() {
    app.quit();
  }

  @on("open-browser-window")
  openBrowserWindow(e: IpcMainInvokeEvent, url: string) {
    // 开始计算主窗口的位置
    const browserView = this.browserWindow.getBrowserView();
    void browserView?.webContents.loadURL(url || "https://baidu.com");
    this.browserWindow.show();
  }

  @on("close-browser-window")
  closeBrowserWindow() {
    this.browserWindow.hide();
  }

  @on("window-minimize")
  windowMinimize(e: IpcMainInvokeEvent, name: string) {
    if (name === "main") {
      this.mainWindow.minimize();
    } else {
      this.browserWindow.minimize();
    }
  }

  @handle("get-current-window")
  getCurrentWindow(e: IpcMainInvokeEvent) {
    return this.browserWindow.getBrowserView();
  }
}
