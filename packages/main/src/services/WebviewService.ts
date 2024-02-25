import { BrowserView, session } from "electron";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import isDev from "electron-is-dev";
import { PERSIST_WEBVIEW, mobileUA, pcUA, pluginPath } from "../helper";
import { ElectronBlocker } from "@cliqz/adblocker-electron";
import fetch from "cross-fetch";
import ElectronLogger from "../vendor/ElectronLogger";
import ElectronStore from "../vendor/ElectronStore";
import MainWindow from "../windows/MainWindow";
import BrowserWindow from "../windows/BrowserWindow";
import VideoRepository from "../repository/VideoRepository";
import { SniffingHelper } from "./SniffingHelperService";
import { resolve } from "path";
import { readFileSync } from "fs";

@injectable()
export default class WebviewService {
  public view: BrowserView;
  private blocker?: ElectronBlocker;

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
    // 初始化 blocker
    this.initBlocker();
  }

  async init(): Promise<void> {
    this.view = new BrowserView({
      webPreferences: {
        partition: PERSIST_WEBVIEW,
        preload: resolve(__dirname, "./preload.js"),
      },
    });
    this.view.setBackgroundColor("#fff");
    this.webContents.setAudioMuted(true);

    const { useProxy, proxy, isMobile } = this.store.store;
    this.setProxy(useProxy, proxy);
    this.setUserAgent(isMobile);

    this.webContents.on("dom-ready", async () => {
      if (isDev && process.env.DEBUG_PLUGINS === "true") {
        this.webContents.executeJavaScript(
          `const script = document.createElement('script');
  script.src = 'http://localhost:8080/src/main.ts';
  script.type = 'module';
  document.body.appendChild(script);`,
        );
      } else {
        const content = readFileSync(pluginPath, "utf-8");
        this.webContents.executeJavaScript(content);
      }
      const title = this.webContents.getTitle();
      const url = this.webContents.getURL();
      const baseInfo = { title, url };
      this.sniffingHelper.reset(baseInfo);
      this.curWindow?.webContents.send("webview-dom-ready", baseInfo);
    });

    // 兼容网站在当前页面中打开
    this.webContents.setWindowOpenHandler(({ url }) => {
      if (url === "about:blank") {
        // 兼容一些网站跳转到 about:blank
        this.webContents.once("will-redirect", async (event, url) => {
          this.loadURL(url, true);
        });
      } else {
        this.loadURL(url, true);
      }

      return { action: "deny" };
    });

    this.sniffingHelper.setDebugger(this.debugger);
    this.sniffingHelper.start();
    this.sniffingHelper.on("source", async (item) => {
      // 这里需要判断是否使用浏览器插件
      const useExtension = this.store.get("useExtension");
      if (useExtension) {
        this.webContents.send("webview-link-message", item);
      } else {
        const video = await this.videoRepository.findVideoByName(item.name);
        if (video) {
          item.name = `${item.name}-${Date.now()}`;
        }
        const res = await this.videoRepository.addVideo(item);
        const mainWebContents = this.mainWindow.window?.webContents;
        if (!mainWebContents) return;
        // 这里向页面发送消息，通知页面更新
        mainWebContents.send("download-item-notifier", res);
      }
    });
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
    isDev && this.webContents.openDevTools();
  }

  hide() {
    this.curWindow?.setBrowserView(null);
    isDev && this.webContents.closeDevTools();
  }

  setBounds(bounds: Electron.Rectangle): void {
    // if (isWin) {
    //   bounds.y = bounds.y + 30;
    // } else {
    //   bounds.y = bounds.y - 0;
    // }
    this.view.setBounds(bounds);
  }

  async loadURL(url?: string, isNewWindow?: boolean) {
    const canGoBack = this.webContents.canGoBack();

    try {
      await this.webContents.loadURL(url || "");
    } catch (err: unknown) {
      this.logger.error("加载 url 时出现错误: ", err);
      throw err;
    } finally {
      if (!canGoBack && !isNewWindow) {
        this.webContents.clearHistory();
      }
    }
  }

  async goBack() {
    if (this.webContents.canGoBack()) {
      this.webContents.goBack();
      return true;
    } else {
      return false;
    }
  }

  async reload() {
    this.webContents.reload();
  }

  async goHome() {
    this.webContents.clearHistory();
  }

  get curWindow() {
    if (this.browserWindow.window) return this.browserWindow.window;
    if (this.mainWindow.window) return this.mainWindow.window;
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

    const enableBlocking = this.store.get("blockAds");
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

  setUserAgent(isMobile?: boolean) {
    if (isMobile) {
      this.webContents.setUserAgent(mobileUA);
    } else {
      this.webContents.setUserAgent(pcUA);
    }
    this.logger.info("设置 user-agent 成功", isMobile);
  }

  get debugger() {
    return this.webContents.debugger;
  }

  get webContents() {
    return this.view.webContents;
  }
}
