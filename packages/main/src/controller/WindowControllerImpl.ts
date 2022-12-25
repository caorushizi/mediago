import { inject, injectable } from "inversify";
import { app, IpcMainInvokeEvent } from "electron";
import { TYPES } from "../types";
import {
  BrowserViewService,
  Controller,
  MainWindowService,
} from "../interfaces";
import { handle, on } from "../decorator/ipc";

@injectable()
export default class WindowControllerImpl implements Controller {
  constructor(
    @inject(TYPES.MainWindowService)
    private readonly mainWindow: MainWindowService,
    @inject(TYPES.BrowserViewService)
    private readonly browserView: BrowserViewService
  ) {}

  @on("close-main-window")
  closeMainWindow(): void {
    app.quit();
  }

  @on("open-url")
  openUrl(e: IpcMainInvokeEvent, url: string): void {
    // 开始计算主窗口的位置
    void this.browserView.webContents.loadURL(
      url != null ? url : "https://baidu.com"
    );
  }

  @on("close-browser-window")
  closeBrowserWindow(): void {}

  @on("window-minimize")
  windowMinimize(e: IpcMainInvokeEvent, name: string): void {
    if (name === "main") {
      this.mainWindow.minimize();
    }
  }

  @handle("get-current-window")
  getCurrentWindow(e: IpcMainInvokeEvent): any {}
}
