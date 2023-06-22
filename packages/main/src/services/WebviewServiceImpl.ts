import {
  BrowserView,
  HeadersReceivedResponse,
  OnHeadersReceivedListenerDetails,
  OnResponseStartedListenerDetails,
  WebContents,
  session,
} from "electron";
import {
  BrowserWindowService,
  LoggerService,
  MainWindowService,
  StoreService,
  WebviewService,
} from "../interfaces";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import isDev from "electron-is-dev";
import { PERSIST_WEBVIEW } from "helper/variables";
import { LinkMessage } from "main";
import { ElectronBlocker } from "@cliqz/adblocker-electron";
import fetch from "cross-fetch";

@injectable()
export default class WebviewServiceImpl implements WebviewService {
  private _view: BrowserView;
  private blocker?: ElectronBlocker;

  constructor(
    @inject(TYPES.MainWindowService)
    private readonly mainWindow: MainWindowService,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.BrowserWindowService)
    private readonly browserWindow: BrowserWindowService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService
  ) {
    // 初始化 blocker
    // this.initBlocker();
  }

  private create(): void {
    this._view = new BrowserView({
      webPreferences: {
        partition: PERSIST_WEBVIEW,
      },
    });
    const webContents = this._view.webContents;
    this._view.setBackgroundColor("#fff");
    webContents.setAudioMuted(true);

    const useProxy = this.storeService.get("useProxy");
    const proxy = this.storeService.get("proxy");
    this.setProxy(useProxy, proxy);
  }

  get view(): BrowserView {
    if (!this._view) this.create();
    return this._view;
  }

  onHeadersReceived = (details: OnResponseStartedListenerDetails): void => {
    const { url } = details;

    const sourceReg = /\.m3u8$/;
    const detailsUrl = new URL(url);

    if (sourceReg.test(detailsUrl.pathname)) {
      this.logger.info("在窗口中捕获 m3u8 链接: ", detailsUrl.toString());
      const webContents = details.webContents;
      const linkMessage: LinkMessage = {
        url: detailsUrl.toString(),
        title: webContents?.getTitle() || "没有获取到名称",
      };
      this.curWindow?.webContents.send("webview-link-message", linkMessage);
    }
  };

  async init(): Promise<void> {
    this.view.webContents.on("dom-ready", () => {
      const title = this.view.webContents.getTitle();
      const url = this.view.webContents.getURL();

      this.curWindow?.webContents.send("webview-dom-ready", { title, url });
    });

    this.view.webContents.setWindowOpenHandler(({ url }) => {
      if (url === "about:blank") {
        // 兼容一些网站跳转到 about:blank
        this.view.webContents.once("will-redirect", async (event, url) => {
          this.loadURL(url, true);
        });
      } else {
        this.loadURL(url, true);
      }

      return { action: "deny" };
    });

    this.session.webRequest.onResponseStarted(
      { urls: ["<all_urls>"] },
      this.onHeadersReceived
    );
  }

  getBounds(): Electron.Rectangle {
    return this.view.getBounds();
  }

  setAutoResize(options: Electron.AutoResizeOptions): void {
    this.view.setAutoResize(options);
  }

  setBackgroundColor(color: string): void {
    this.view.setBackgroundColor(color);
  }

  show() {
    this.curWindow?.setBrowserView(this.view);
    isDev && this.view.webContents.openDevTools();
  }

  hide() {
    this.curWindow?.setBrowserView(null);
    isDev && this.view.webContents.closeDevTools();
  }

  setBounds(bounds: Electron.Rectangle): void {
    if (process.platform === "darwin") {
      bounds.y = bounds.y + 30;
    }
    this.view.setBounds(bounds);
  }

  async loadURL(url?: string, isNewWindow?: boolean) {
    const canGoBack = this.view.webContents.canGoBack();
    try {
      await this.view.webContents.loadURL(url || "");
    } catch (err: any) {
      this.logger.error("加载 url 时出现错误: ", err);
    }
    if (!canGoBack && !isNewWindow) {
      this.view.webContents.clearHistory();
    }
  }

  async goBack() {
    if (this.view.webContents.canGoBack()) {
      this.view.webContents.goBack();
      return true;
    } else {
      return false;
    }
  }

  async reload() {
    this.view.webContents.reload();
  }

  async goHome() {
    this.view.webContents.clearHistory();
  }

  get curWindow() {
    if (this.browserWindow.window && this.browserWindow.show) {
      return this.browserWindow.window;
    }
    if (this.mainWindow.window && this.mainWindow.show) {
      return this.mainWindow.window;
    }
    return null;
  }

  private get session() {
    return session.fromPartition(PERSIST_WEBVIEW);
  }

  private enableProxy(proxy: string) {
    if (!proxy) {
      this.logger.error("[proxy] 代理地址不能为空");
      return;
    }

    // 处理 proxy 地址的合法性
    if (!/https?:\/\//.test(proxy)) {
      proxy = `http://${proxy}`;
    }

    this.session.setProxy({ proxyRules: proxy });
    this.logger.info(`[proxy] 代理开启成功，代理地址为${proxy}`);
  }

  private disableProxy() {
    this.session.setProxy({ proxyRules: "" });
    this.logger.info("[proxy] 代理关闭成功");
  }

  setProxy(useProxy: boolean, proxy: string): void {
    if (useProxy) {
      this.enableProxy(proxy);
    } else {
      this.disableProxy();
    }
  }

  setBlocking(enableBlocking: boolean): void {
    if (enableBlocking) {
      this.enableBlocking();
    } else {
      this.disableBlocking();
    }
  }

  async initBlocker() {
    this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);

    const enableBlocking = this.storeService.get("blockAds");
    this.setBlocking(enableBlocking);
  }

  private enableBlocking() {
    if (!this.blocker) {
      this.logger.error("开启 blocker 失败，未初始化");
      return;
    }
    this.blocker.enableBlockingInSession(this.session);
    this.logger.info("开启 blocker 成功");
  }

  private disableBlocking() {
    if (!this.blocker) {
      this.logger.error("关闭 blocker 失败，未初始化");
      return;
    }
    if (!this.blocker.isBlockingEnabled(this.session)) {
      return;
    }
    this.blocker.disableBlockingInSession(this.session);
    this.logger.info("关闭 blocker 成功");
  }
}
