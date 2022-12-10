import { inject, injectable } from "inversify";
import { handle, on } from "../utils/ipc";
import { app, IpcMainInvokeEvent } from "electron";
import { TYPES } from "../types";
import {
  BrowserWindowService,
  Controller,
  MainWindowService,
} from "../interfaces";

@injectable()
export default class WindowController implements Controller {
  constructor(
    @inject(TYPES.BrowserWindowService)
    private browserWindow: BrowserWindowService,
    @inject(TYPES.MainWindowService)
    private mainWindow: MainWindowService
  ) {
    console.log(123123123);
  }
  @on("close-main-window")
  private closeMainWindow() {
    app.quit();
  }

  @on("open-browser-window")
  private openBrowserWindow(e: IpcMainInvokeEvent, url: string) {
    // 开始计算主窗口的位置
    const browserView = this.browserWindow.getBrowserView();
    browserView?.webContents.loadURL(url || "https://baidu.com");
    this.browserWindow.show();
  }

  @on("close-browser-window")
  private closeBrowserWindow() {
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
