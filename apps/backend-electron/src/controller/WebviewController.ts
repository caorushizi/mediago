import { type Controller, i18n } from "@mediago/shared/common";
import { TYPES } from "@mediago/shared/node";
import { type IpcMainEvent, Menu, type MenuItem, type MenuItemConstructorOptions } from "electron";
import { inject, injectable } from "inversify";
import { handle } from "../helper/index";
import type { SniffingHelper } from "../services/SniffingHelperService";
import type WebviewService from "../services/WebviewService";
import type ElectronStore from "../vendor/ElectronStore";

@injectable()
export default class WebviewController implements Controller {
  constructor(
    @inject(TYPES.WebviewService)
    private readonly webview: WebviewService,
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore,
    @inject(TYPES.SniffingHelper)
    private readonly sniffingHelper: SniffingHelper,
  ) {}

  @handle("set-webview-bounds")
  async setWebviewBounds(e: IpcMainEvent, bounds: Electron.Rectangle) {
    this.webview.setBounds(bounds);
  }

  @handle("webview-load-url")
  async browserViewLoadUrl(e: IpcMainEvent, url: string): Promise<void> {
    await this.webview.loadURL(url);
  }

  @handle("webview-url-contextmenu")
  async webviewUrlContextMenu() {
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: i18n.t("copy"),
        role: "copy",
      },
      {
        label: i18n.t("paste"),
        role: "paste",
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
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
    this.store.set("isMobile", isMobile);
  }

  @handle("plugin-ready")
  async pluginReady() {
    this.sniffingHelper.pluginReady();
  }

  @handle("clear-webview-cache")
  async clearWebviewCache() {
    return this.webview.clearCache();
  }
}
