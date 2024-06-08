import { WebContentsView, session } from "electron";
import { inject, injectable } from "inversify";
import { TYPES } from "../types.ts";
import isDev from "electron-is-dev";
import {
  PERSIST_WEBVIEW,
  fetch,
  mobileUA,
  pcUA,
  pluginPath,
} from "../helper/index.ts";
import { ElectronBlocker } from "@cliqz/adblocker-electron";
import ElectronLogger from "../vendor/ElectronLogger.ts";
import ElectronStore from "../vendor/ElectronStore.ts";
import MainWindow from "../windows/MainWindow.ts";
import BrowserWindow from "../windows/BrowserWindow.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import { SniffingHelper } from "./SniffingHelperService.ts";
import { resolve } from "path";
import { readFileSync } from "fs-extra";

@injectable()
export default class WebviewService {
  public view: WebContentsView;
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
    this.view = new WebContentsView({
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
      const baseInfo = {
        title: this.webContents.getTitle(),
        url: this.webContents.getURL(),
      };
      this.sniffingHelper.reset(baseInfo);
      this.window.webContents.send("webview-dom-ready", baseInfo);

      try {
        if (isDev && process.env.DEBUG_PLUGINS === "true") {
          const content =
            'function addScript(src){const script=document.createElement("script");script.src=src;script.type="module";document.body.appendChild(script)}addScript("http://localhost:8080/src/main.ts");';
          await this.webContents.executeJavaScript(content);
        } else {
          const content = readFileSync(pluginPath, "utf-8");
          await this.webContents.executeJavaScript(content);
        }
      } catch (err) {
        // empty
      }
    });

    // 兼容网站在当前页面中打开
    this.webContents.setWindowOpenHandler(({ url }) => {
      this.loadURL(url, true);

      return { action: "deny" };
    });

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

  setBackgroundColor(color: string): void {
    this.view.setBackgroundColor(color);
  }

  show() {
    this.window.contentView.addChildView(this.view);
    isDev && this.webContents.openDevTools();
  }

  hide() {
    this.window.contentView.removeChildView(this.view);
    isDev && this.webContents.closeDevTools();
  }

  setBounds(bounds: Electron.Rectangle): void {
    this.view.setBounds(bounds);
  }

  async loadURL(url?: string, isNewWindow?: boolean) {
    const canGoBack = this.webContents.canGoBack();

    try {
      this.webContents.stop();
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
    this.webContents.stop();
    this.webContents.clearHistory();
  }

  get window() {
    if (this.browserWindow.window) return this.browserWindow.window;
    if (this.mainWindow.window) return this.mainWindow.window;
    throw new Error("未找到当前窗口");
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

  captureView(): Promise<Electron.NativeImage> {
    return this.view.webContents.capturePage();
  }

  sendToWindow(channel: string, ...args: unknown[]) {
    this.window.webContents.send(channel, ...args);
  }
}
