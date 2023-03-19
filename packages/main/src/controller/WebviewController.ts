import { IpcMainEvent } from "electron";
import { Favorite } from "entity/Favorite";
import { db, workspace } from "helper/variables";
import { inject, injectable } from "inversify";
import { IndexData } from "main";
import { handle, on } from "../helper/decorator";
import {
  StoreService,
  LoggerService,
  type Controller,
  FavoriteRepository,
  WebviewService,
} from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class WebviewController implements Controller {
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly store: StoreService,
    @inject(TYPES.FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
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

  @handle("webview-go-home")
  async webviewGoHome() {
    await this.webview.goHome();
  }
}
