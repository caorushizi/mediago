import { IpcMainEvent } from "electron";
import { inject, injectable } from "inversify";
import { handle } from "../helper/decorator";
import { LoggerService, type Controller, WebviewService } from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class WebviewController implements Controller {
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.WebviewService)
    private readonly webview: WebviewService
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
}
