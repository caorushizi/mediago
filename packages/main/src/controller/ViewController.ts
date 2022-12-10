import { on } from "../utils/ipc";
import { IpcMainInvokeEvent } from "electron";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import {
  BrowserViewService,
  BrowserWindowService,
  Controller,
} from "../interfaces";

@injectable()
export default class ViewController implements Controller {
  constructor(
    @inject(TYPES.BrowserViewService)
    private browserWindow: BrowserWindowService,
    @inject(TYPES.BrowserViewService)
    private browserView: BrowserViewService
  ) {
    console.log(123123);
  }
  @on("set-browser-view-bounds")
  setBrowserViewBounds(e: IpcMainInvokeEvent, rect: any) {
    console.log("setBrowserViewBounds", this);
    this.browserView.setBounds(rect);
  }

  @on("browser-view-go-back")
  browserViewGoBack() {
    const canGoBack = this.browserView.webContents.canGoBack();
    if (canGoBack) this.browserView.webContents.goBack();
  }

  @on("browser-view-reload")
  browserViewReload() {
    this.browserView.webContents.reload();
  }

  @on("browser-view-load-url")
  browserViewLoadUrl(e: IpcMainInvokeEvent, url: string) {
    void this.browserView.webContents.loadURL(url || "https://baidu.com");
  }
}
