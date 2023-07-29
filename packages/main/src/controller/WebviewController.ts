import { IpcMainEvent } from "electron";
import { inject, injectable } from "inversify";
import { handle } from "../helper";
import { type Controller } from "../interfaces";
import { TYPES } from "../types";
import WebviewService from "../services/WebviewService";
import StoreService from "../services/StoreService";

@injectable()
export default class WebviewController implements Controller {
  constructor(
    @inject(TYPES.WebviewService)
    private readonly webview: WebviewService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService
  ) {}

  @handle("set-webview-bounds")
  async setWebviewBounds(e: IpcMainEvent, bounds: Electron.Rectangle) {
    this.webview.setBounds(bounds);
  }

  @handle("webview-load-url")
  async browserViewLoadUrl(e: IpcMainEvent, url?: string): Promise<void> {
    await this.webview.loadURL(url);
  }

  @handle("webview-go-back")
  async webviewGoBack(): Promise<boolean> {
    return this.webview.goBack();
  }

  @handle("webview-reload")
  async webviewReload() {
    await this.webview.reload();
  }

  @handle("webview-show")
  async webviewShow() {
    this.webview.show();
  }

  @handle("webview-hide")
  async webviewHide() {
    this.webview.hide();
  }

  @handle("webview-go-home")
  async webviewGoHome() {
    await this.webview.goHome();
  }

  @handle("webview-change-user-agent")
  async webviewChangeUserAgent(e: IpcMainEvent, isMobile: boolean) {
    this.webview.setUserAgent(isMobile);
    this.storeService.set("isMobile", isMobile);
  }
}
