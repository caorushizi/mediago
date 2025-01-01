import { Event, HandlerDetails, WebContentsView, session } from "electron";
import { inject, injectable } from "inversify";
import { TYPES } from "../types.ts";
import isDev from "electron-is-dev";
import {
  PERSIST_WEBVIEW,
  PRIVACY_WEBVIEW,
  fetch,
  mobileUA,
  pcUA,
  pluginPath,
} from "../helper/index.ts";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import ElectronLogger from "../vendor/ElectronLogger.ts";
import ElectronStore from "../vendor/ElectronStore.ts";
import MainWindow from "../windows/MainWindow.ts";
import BrowserWindow from "../windows/BrowserWindow.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import { SniffingHelper, SourceParams } from "./SniffingHelperService.ts";
import { resolve } from "path";
import { readFileSync } from "fs-extra";
import { isDeeplink } from "../helper/utils.ts";
import i18n from "../i18n/index.ts";

@injectable()
export default class WebviewService {
  private view: WebContentsView | null = null;
  private blocker?: ElectronBlocker;
  private defaultSession: string;
  private viewShow = false;

  constructor(
    @inject(TYPES.MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(TYPES.BrowserWindow)
    private readonly browserWindow: BrowserWindow,
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.SniffingHelper)
    private readonly sniffingHelper: SniffingHelper,
  ) {
    // Initialize the blocker
    this.initBlocker();

    const { useProxy, proxy, privacy } = this.store.store;

    this.sniffingHelper.start(privacy);
    this.sniffingHelper.on("source", this.onSource);

    this.setDefaultSession(privacy, true);
    this.setProxy(useProxy, proxy);
  }

  async init(): Promise<void> {
    this.view = new WebContentsView({
      webPreferences: {
        partition: this.defaultSession,
        preload: resolve(__dirname, "./preload.js"),
      },
    });

    if (isDev) {
      this.view.webContents.openDevTools();
    }

    this.view.setBackgroundColor("#fff");
    const { isMobile, audioMuted } = this.store.store;
    this.setAudioMuted(audioMuted);
    this.setUserAgent(isMobile);

    this.view.webContents.on("dom-ready", this.onDomReady);
    this.view.webContents.on("did-navigate", this.onDidNavigate);
    this.view.webContents.on("did-fail-load", this.onDidFailLoad);
    this.view.webContents.on("did-navigate-in-page", this.onDidNavigateInPage);
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
    this.window.webContents.send("webview-dom-ready", pageInfo);
  };

  onDidNavigate = async () => {
    if (!this.view) return;
    const pageInfo = this.getPageInfo();
    this.sniffingHelper.update(pageInfo);
    this.window.webContents.send("webview-did-navigate", pageInfo);

    try {
      if (isDev && process.env.DEBUG_PLUGINS === "true") {
        const content =
          'function addScript(src){const script=document.createElement("script");script.src=src;script.type="module";document.body.appendChild(script)}addScript("http://localhost:8080/src/main.ts");';
        await this.view.webContents.executeJavaScript(content);
      } else {
        const content = readFileSync(pluginPath, "utf-8");
        await this.view.webContents.executeJavaScript(content);
      }
    } catch (err) {
      // empty
    }

    this.sniffingHelper.checkPageInfo();
  };

  onDidFailLoad = (e: Event, code: number, desc: string) => {
    // this.window.webContents.send("webview-fail-load", { code, desc });
    this.logger.error(`[Webview] fail load: ${code} ${desc}`);
  };

  onDidNavigateInPage = () => {
    if (!this.view) return;
    const pageInfo = this.getPageInfo();
    this.sniffingHelper.update(pageInfo);
    this.window.webContents.send("webview-did-navigate-in-page", pageInfo);
  };

  onOpenNewWindow = ({ url }: HandlerDetails) => {
    this.loadURL(url);

    return { action: "deny" } as { action: "deny" };
  };

  onSource = async (item: SourceParams) => {
    if (!this.view) return;
    // Here you need to determine whether to use a browser plug-in
    const useExtension = this.store.get("useExtension");
    if (useExtension) {
      // this.view.webContents.send("webview-link-message", item);
      this.window.webContents.send("webview-link-message", item);
    } else {
      const video = await this.videoRepository.findVideoByName(item.name);
      if (video) {
        item.name = `${item.name}-${Date.now()}`;
      }
      const res = await this.videoRepository.addVideo(item);
      const mainWebContents = this.mainWindow.window?.webContents;
      if (!mainWebContents) return;
      // This sends a message to the page notifying it of the update
      mainWebContents.send("download-item-notifier", res);
    }
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
    this.window.contentView.addChildView(this.view);
    this.viewShow = true;
  }

  hide() {
    if (!this.view) return;
    this.window.contentView.removeChildView(this.view);
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
    if (webContents.canGoBack()) {
      webContents.goBack();
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
    throw new Error(i18n.t("currentWindowNotFound"));
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
    if (!/https?:\/\//.test(proxy)) {
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
    this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);

    const enableBlocking = this.store.get("blockAds");
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

  sendToWindow(channel: string, ...args: unknown[]) {
    this.window.webContents.send(channel, ...args);
  }

  destroyView() {
    if (this.view && this.window) {
      this.view.webContents.close();
      this.window.contentView.removeChildView(this.view);
    }
    // FIXME: To avoid memory leaks, the view needs to be destroyed here
    this.view = null;
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
      const { useProxy, proxy } = this.store.store;
      this.destroyView();
      this.init();
      this.setProxy(useProxy, proxy);
      this.sniffingHelper.start(isPrivacy);
    }

    if (!init) {
      this.window.webContents.send("change-privacy");
    }
  }
}
