import { provide } from "@inversifyjs/binding-decorators";
import {
  CLEAR_WEBVIEW_CACHE,
  type Controller,
  PLUGIN_READY,
  SET_WEBVIEW_BOUNDS,
  WEBVIEW_CHANGE_USER_AGENT,
  WEBVIEW_GO_BACK,
  WEBVIEW_GO_HOME,
  WEBVIEW_HIDE,
  WEBVIEW_LOAD_URL,
  WEBVIEW_RELOAD,
  WEBVIEW_SHOW,
  WEBVIEW_URL_CONTEXTMENU,
} from "@mediago/shared-common";
import { handle, i18n, TYPES } from "@mediago/shared-node";
import {
  type IpcMainEvent,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
} from "electron";
import { inject, injectable } from "inversify";
import { SniffingHelper } from "../services/sniffing-helper.service";
import WebviewService from "../services/webview.service";
import ElectronStore from "../vendor/ElectronStore";

@injectable()
@provide(TYPES.Controller)
export default class WebviewController implements Controller {
  constructor(
    @inject(WebviewService)
    private readonly webview: WebviewService,
    @inject(ElectronStore)
    private readonly store: ElectronStore,
    @inject(SniffingHelper)
    private readonly sniffingHelper: SniffingHelper,
  ) {}

  @handle(SET_WEBVIEW_BOUNDS)
  async setWebviewBounds(e: IpcMainEvent, bounds: Electron.Rectangle) {
    this.webview.setBounds(bounds);
  }

  @handle(WEBVIEW_LOAD_URL)
  async browserViewLoadUrl(e: IpcMainEvent, url: string): Promise<void> {
    await this.webview.loadURL(url);
  }

  @handle(WEBVIEW_URL_CONTEXTMENU)
  async appContextMenu() {
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

  @handle(WEBVIEW_GO_BACK)
  async webviewGoBack(): Promise<boolean> {
    return this.webview.goBack();
  }

  @handle(WEBVIEW_RELOAD)
  async webviewReload() {
    await this.webview.reload();
  }

  @handle(WEBVIEW_SHOW)
  async webviewShow() {
    this.webview.show();
  }

  @handle(WEBVIEW_HIDE)
  async webviewHide() {
    this.webview.hide();
  }

  @handle(WEBVIEW_GO_HOME)
  async webviewGoHome() {
    await this.webview.goHome();
  }

  @handle(WEBVIEW_CHANGE_USER_AGENT)
  async webviewChangeUserAgent(e: IpcMainEvent, isMobile: boolean) {
    this.webview.setUserAgent(isMobile);
    this.store.set("isMobile", isMobile);
  }

  @handle(PLUGIN_READY)
  async pluginReady() {
    this.sniffingHelper.pluginReady();
  }

  @handle(CLEAR_WEBVIEW_CACHE)
  async clearWebviewCache() {
    return this.webview.clearCache();
  }
}
