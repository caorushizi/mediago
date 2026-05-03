import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import { provide } from "@inversifyjs/binding-decorators";
import { i18n } from "../core/i18n";
import {
  type Event,
  type HandlerDetails,
  nativeTheme,
  session,
  WebContentsView,
} from "electron";
import isDev from "electron-is-dev";
import { inject, injectable } from "inversify";
import {
  isDeeplink,
  mobileUA,
  PERSIST_WEBVIEW,
  PRIVACY_WEBVIEW,
  pcUA,
  pluginUrl,
} from "../utils";
import ElectronLogger from "../vendor/ElectronLogger";
import GoConfigCache from "./go-config-cache";
import BrowserWindow from "../windows/browser.window";
import MainWindow from "../windows/main.window";
import { SniffingHelper, type SourceParams } from "./sniffing-helper.service";

const require = createRequire(import.meta.url);

const preload = require.resolve("@mediago/electron-preload");
const BROWSER_VIEW_BOTTOM_RADIUS = 8;
const BROWSER_VIEW_DARK_SHELL_BACKGROUND = "#141415";
const BROWSER_VIEW_MAIN_SHELL_BACKGROUND = "#F4F7FA";
const BROWSER_VIEW_WINDOW_SHELL_BACKGROUND = "#EBF0F5";

@injectable()
@provide()
export default class WebviewService {
  private view: WebContentsView | null = null;
  private blocker?: ElectronBlocker;
  private defaultSession: string;
  private viewShow = false;
  private bottomRadiusCssKey?: string;

  constructor(
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(BrowserWindow)
    private readonly browserWindow: BrowserWindow,
    @inject(GoConfigCache)
    private readonly configCache: GoConfigCache,
    @inject(SniffingHelper)
    private readonly sniffingHelper: SniffingHelper,
  ) {
    // Initialize the blocker
    this.initBlocker();

    const { useProxy, proxy, privacy } = this.configCache.store;

    this.sniffingHelper.start(privacy);
    this.sniffingHelper.on("source", this.onSource);
    nativeTheme.on("updated", this.onNativeThemeUpdated);

    this.setDefaultSession(privacy, true);
    this.setProxy(useProxy, proxy);
  }

  async init(): Promise<void> {
    if (this.view) return;

    this.view = new WebContentsView({
      webPreferences: {
        partition: this.defaultSession,
        preload: preload,
      },
    });

    if (isDev) {
      this.view.webContents.openDevTools();
    }

    this.view.setBackgroundColor("#fff");
    const { isMobile, audioMuted } = this.configCache.store;
    this.setAudioMuted(audioMuted);
    this.setUserAgent(isMobile);

    this.view.webContents.on("dom-ready", this.onDomReady);
    this.view.webContents.on("did-navigate", this.onDidNavigate);
    this.view.webContents.on("did-fail-load", this.onDidFailLoad);
    this.view.webContents.on("did-navigate-in-page", this.onDidNavigateInPage);
    this.view.webContents.on("page-title-updated", this.onPageTitleUpdated);
    this.view.webContents.on("will-navigate", this.onWillNavigate);
    this.view.webContents.setWindowOpenHandler(this.onOpenNewWindow);
  }

  onWillNavigate = (e: Event, url: string) => {
    if (isDeeplink(url)) {
      e.preventDefault();
    }
  };

  onDomReady = () => {
    if (!this.view) return;
    const pageInfo = this.getPageInfo();
    this.sniffingHelper.update(pageInfo);
    void this.injectBottomCornerRadius();
    this.window?.webContents.send("browser:domReady", pageInfo);
  };

  onDidNavigate = async () => {
    if (!this.view) return;
    const pageInfo = this.getPageInfo();
    this.sniffingHelper.update(pageInfo);
    this.window?.webContents.send("browser:didNavigate", pageInfo);

    try {
      const content = await readFile(pluginUrl, "utf-8");
      await this.view.webContents.executeJavaScript(content);
    } catch {
      // empty
    }

    this.sniffingHelper.checkPageInfo();
  };

  onDidFailLoad = (e: Event, code: number, desc: string) => {
    this.window?.webContents.send("browser:failLoad", { code, desc });
    this.logger.error(`[Webview] fail load: ${code} ${desc}`);
  };

  onDidNavigateInPage = () => {
    if (!this.view) return;
    const pageInfo = this.getPageInfo();
    this.sniffingHelper.update(pageInfo);
    this.sniffingHelper.checkPageInfo();
    this.window?.webContents.send("browser:didNavigateInPage", pageInfo);
  };

  onPageTitleUpdated = () => {
    if (!this.view) return;
    const pageInfo = this.getPageInfo();
    this.sniffingHelper.update(pageInfo);
  };

  onOpenNewWindow = ({ url }: HandlerDetails) => {
    this.loadURL(url);

    return { action: "deny" } as { action: "deny" };
  };

  onSource = async (item: SourceParams) => {
    if (!this.view) return;
    // Send to the window for processing
    // Previously addDownloadTask was called here; now handled by Go server
    this.window?.webContents.send("browser:sourceDetected", item);
  };

  onNativeThemeUpdated = () => {
    this.refreshBottomCornerRadius();
  };

  getPageInfo() {
    if (!this.view) {
      throw new Error(i18n.t("browserViewNotFound"));
    }
    return {
      title: this.view.webContents.getTitle(),
      url: this.view.webContents.getURL(),
    };
  }

  getBounds(): Electron.Rectangle {
    if (!this.view) {
      throw new Error(i18n.t("browserViewNotFound"));
    }
    return this.view.getBounds();
  }

  setBounds(bounds: Electron.Rectangle): void {
    if (!this.view) return;
    this.view.setBounds(bounds);
  }

  setBackgroundColor(color: string): void {
    if (!this.view) return;
    this.view.setBackgroundColor(color);
  }

  show() {
    if (!this.view) return;
    this.window?.contentView.addChildView(this.view);
    this.viewShow = true;
    void this.injectBottomCornerRadius();
  }

  hide() {
    if (!this.view) return;
    this.window?.contentView.removeChildView(this.view);
    this.viewShow = false;
  }

  loadURL(url: string) {
    // Start loading url
    if (!this.view) {
      this.init();
    }
    if (!this.view) return;

    // 1. Stop current navigation
    this.view.webContents.stop();

    // 2. Load a new url
    this.view.webContents.loadURL(url);
  }

  async goBack() {
    if (!this.view) {
      throw new Error(i18n.t("browserViewNotFound"));
    }
    const { webContents } = this.view;
    if (webContents.navigationHistory.canGoBack()) {
      webContents.navigationHistory.goBack();
      return true;
    } else {
      this.destroyView();
      return false;
    }
  }

  async reload() {
    if (!this.view) {
      throw new Error(i18n.t("browserViewNotFound"));
    }
    this.view.webContents.reload();
  }

  async goHome() {
    if (!this.view) {
      throw new Error(i18n.t("browserViewNotFound"));
    }
    this.view.webContents.stop();
    this.view.webContents.clearHistory();
    this.destroyView();
  }

  get window() {
    if (this.browserWindow.window) return this.browserWindow.window;
    if (this.mainWindow.window) return this.mainWindow.window;

    this.logger.error("Current window not found");
    return null;
  }

  private get session() {
    return session.fromPartition(this.defaultSession);
  }

  private enableProxy(proxy: string) {
    if (!proxy) {
      this.logger.error(`[Proxy] proxy address is empty`);
      return;
    }

    // Process the validity of the proxy address
    // Support http/https/socks5 proxies; default to http if no scheme provided
    if (!/^(https?|socks5):\/\//i.test(proxy)) {
      proxy = `http://${proxy}`;
    }

    this.session.setProxy({ proxyRules: proxy });
    this.logger.info(`[Proxy] enable proxy: ${proxy}`);
  }

  private disableProxy() {
    this.session.setProxy({ proxyRules: "" });
    this.logger.info(`[Proxy] disable proxy`);
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
    this.blocker = await ElectronBlocker.fromLists(fetch, [
      "https://easylist.to/easylist/easylist.txt",
    ]);

    const enableBlocking = this.configCache.get("blockAds");
    this.setBlocking(enableBlocking);
  }

  private enableBlocking() {
    if (!this.blocker) {
      this.logger.error(`[AdBlocker] enable failed(not initialized)`);
      return;
    }
    if (this.blocker.isBlockingEnabled(this.session)) {
      return;
    }
    this.blocker.enableBlockingInSession(this.session);
    this.logger.info(`[AdBlocker] enable`);
  }

  private disableBlocking() {
    if (!this.blocker) {
      this.logger.error(`[AdBlocker] disable failed(not initialized)`);
      return;
    }
    if (!this.blocker.isBlockingEnabled(this.session)) {
      return;
    }
    this.blocker.disableBlockingInSession(this.session);
    this.logger.info(`[AdBlocker] disable`);
  }

  setAudioMuted(audioMuted?: boolean) {
    if (!this.view) return;
    this.view.webContents.setAudioMuted(audioMuted ? true : false);
    this.logger.info(`Play audio: ${!audioMuted}`);
  }

  setUserAgent(isMobile?: boolean) {
    if (!this.view) return;
    if (isMobile) {
      this.view.webContents.setUserAgent(mobileUA);
    } else {
      this.view.webContents.setUserAgent(pcUA);
    }
    this.logger.info(`[UA] User-Agent: ${isMobile ? "mobile" : "PC"}`);
  }

  async captureView(): Promise<Electron.NativeImage | null> {
    if (!this.view) {
      throw new Error(i18n.t("browserViewNotFound"));
    }
    if (!this.viewShow) {
      return null;
    }
    return this.view.webContents.capturePage();
  }

  refreshBottomCornerRadius() {
    void this.injectBottomCornerRadius();
  }

  sendToWindow(channel: string, ...args: unknown[]) {
    this.window?.webContents.send(channel, ...args);
  }

  private getBottomCornerBackgroundColor() {
    if (nativeTheme.shouldUseDarkColors) {
      return BROWSER_VIEW_DARK_SHELL_BACKGROUND;
    }

    if (this.browserWindow.window) {
      return BROWSER_VIEW_WINDOW_SHELL_BACKGROUND;
    }

    return BROWSER_VIEW_MAIN_SHELL_BACKGROUND;
  }

  private getBottomCornerRadiusCss() {
    const radius = BROWSER_VIEW_BOTTOM_RADIUS;
    const backgroundColor = this.getBottomCornerBackgroundColor();

    return `
      :root::before,
      :root::after {
        content: "";
        position: fixed;
        bottom: 0;
        width: ${radius}px;
        height: ${radius}px;
        pointer-events: none;
        z-index: 2147483647;
      }

      :root::before {
        left: 0;
        background: radial-gradient(
          circle at top right,
          transparent ${radius - 0.5}px,
          ${backgroundColor} ${radius}px
        );
      }

      :root::after {
        right: 0;
        background: radial-gradient(
          circle at top left,
          transparent ${radius - 0.5}px,
          ${backgroundColor} ${radius}px
        );
      }
    `;
  }

  private async injectBottomCornerRadius() {
    if (!this.view || this.view.webContents.isDestroyed()) return;

    try {
      const { webContents } = this.view;
      if (this.bottomRadiusCssKey) {
        await webContents
          .removeInsertedCSS(this.bottomRadiusCssKey)
          .catch(() => {
            // The previous key may belong to a document that has already navigated.
          });
        this.bottomRadiusCssKey = undefined;
      }

      this.bottomRadiusCssKey = await webContents.insertCSS(
        this.getBottomCornerRadiusCss(),
        { cssOrigin: "user" },
      );
    } catch (error) {
      this.logger.error(
        "[Webview] failed to inject bottom corner radius CSS",
        error,
      );
    }
  }

  private removeViewListeners() {
    if (!this.view) return;
    const { webContents } = this.view;
    webContents.removeListener("dom-ready", this.onDomReady);
    webContents.removeListener("did-navigate", this.onDidNavigate);
    webContents.removeListener("did-fail-load", this.onDidFailLoad);
    webContents.removeListener(
      "did-navigate-in-page",
      this.onDidNavigateInPage,
    );
    webContents.removeListener("page-title-updated", this.onPageTitleUpdated);
    webContents.removeListener("will-navigate", this.onWillNavigate);
  }

  destroyView() {
    if (this.view) {
      this.removeViewListeners();
      this.view.webContents.close();
      this.window?.contentView.removeChildView(this.view);
    }
    this.view = null;
    this.bottomRadiusCssKey = undefined;
  }

  async clearCache() {
    await this.session.clearCache();
    await this.session.clearStorageData();
  }

  setDefaultSession(isPrivacy = false, init = false) {
    this.logger.info(`[Session] ${isPrivacy ? "Privacy" : "Persist"} Mode`);
    if (isPrivacy) {
      this.defaultSession = PRIVACY_WEBVIEW;
    } else {
      this.defaultSession = PERSIST_WEBVIEW;
    }

    if (this.view) {
      const { useProxy, proxy } = this.configCache.store;
      this.destroyView();
      this.init();
      this.setProxy(useProxy, proxy);
      this.sniffingHelper.start(isPrivacy);
    }

    if (!init) {
      this.window?.webContents.send("browser:privacyChanged");
    }
  }
}
