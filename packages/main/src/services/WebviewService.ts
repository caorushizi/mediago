import { BrowserView, session } from "electron";
import { DownloadType } from "../interfaces";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import isDev from "electron-is-dev";
import { PERSIST_WEBVIEW, mobileUA, pcUA } from "../helper";
import { ElectronBlocker } from "@cliqz/adblocker-electron";
import fetch from "cross-fetch";
import path from "path";
import { WebSource } from "../main";
import { load } from "cheerio";
import LoggerService from "./LoggerService";
import StoreService from "./StoreService";
import MainWindow from "../windows/MainWindow";
import BrowserWindow from "../windows/BrowserWindow";
import VideoRepository from "../repository/VideoRepository";
import { readFileSync } from "fs-extra";

interface SourceParams {
  url: string;
  requestId: string;
  headers: Record<string, any>;
  filter: SourceFilter;
  documentURL: string;
}

interface SourceFilter {
  matches: RegExp[];
  type: DownloadType;
  handler: (this: WebviewService, params: SourceParams) => Promise<WebSource>;
}

const filterList: SourceFilter[] = [
  {
    matches: [/\.m3u8/],
    type: DownloadType.m3u8,
    async handler(params) {
      const { url, headers } = params;
      const webContents = this.view.webContents;
      const title = webContents.getTitle();

      return {
        url,
        type: DownloadType.m3u8,
        name: title || "没有获取到名称",
        headers: JSON.stringify(headers),
      };
    },
  },
  {
    // TODO: 合集、列表、收藏夹
    matches: [/^https?:\/\/(www\.)?bilibili.com\/video/],
    type: DownloadType.bilibili,
    async handler(params) {
      const { url, requestId } = params;
      const response = await this.debugger.sendCommand(
        "Network.getResponseBody",
        {
          requestId,
        }
      );
      const $ = load(response.body);
      const title = $("title").text();

      return {
        url,
        type: DownloadType.bilibili,
        name: title || "没有获取到名称",
      };
    },
  },
];

let styleText = "";
if (!isDev) {
  const preloadPath = path.resolve(__dirname, "../../plugin/style.css");
  styleText = readFileSync(preloadPath, "utf-8");
}

// FIXME: 需要重构
@injectable()
export default class WebviewService {
  public view: BrowserView;
  private blocker?: ElectronBlocker;
  private pageSources = new Set();
  requestMap: Record<string, SourceParams> = {};
  responseMap: Record<string, string[]> = {};

  constructor(
    @inject(TYPES.MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.BrowserWindow)
    private readonly browserWindow: BrowserWindow,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository
  ) {
    // 初始化 blocker
    this.initBlocker();
  }

  async init(): Promise<void> {
    this.view = new BrowserView({
      webPreferences: {
        partition: PERSIST_WEBVIEW,
        preload: isDev
          ? path.resolve(__dirname, "./devReload.js")
          : path.resolve(__dirname, "../../plugin/plugin.js"),
      },
    });
    this.view.setBackgroundColor("#fff");
    this.view.webContents.setAudioMuted(true);

    const { useProxy, proxy, isMobile } = this.storeService.store;
    this.setProxy(useProxy, proxy);
    this.setUserAgent(isMobile);

    this.view.webContents.on("dom-ready", async () => {
      this.pageSources.clear();
      if (!isDev) {
        this.view.webContents.insertCSS(styleText);
      }
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

    try {
      this.debugger.attach("1.1");
    } catch (err) {
      this.logger.error("Debugger attach failed : ", err);
    }

    this.debugger.on("detach", (event, reason) => {
      this.logger.error("Debugger detached due to : ", reason);
    });

    this.debugger.on("message", async (event, method, params) => {
      if (method === "Network.requestWillBeSent") {
        const { requestId, documentURL } = params;
        const { url, headers } = params.request;

        for (const filter of filterList) {
          for (const match of filter.matches) {
            if (!match.test(url)) {
              continue;
            }

            if (this.pageSources.has(url)) {
              continue;
            }

            this.pageSources.add(url);
            this.responseMap[documentURL] = [];
            this.requestMap[requestId] = {
              url,
              headers,
              requestId,
              filter,
              documentURL,
            };
            break;
          }
        }
      }
      if (method === "Network.loadingFinished") {
        const { requestId } = params;
        const sourceParams = this.requestMap[requestId];

        if (sourceParams) {
          const { filter, url, documentURL } = sourceParams;
          const objUrl = new URL(url);

          const { body, base64Encoded } = await this.debugger.sendCommand(
            "Network.getResponseBody",
            {
              requestId: params.requestId,
            }
          );
          if (this.responseMap[documentURL].length > 0) {
            const bodys = this.responseMap[documentURL];
            const exist = bodys.some((item) =>
              new RegExp(objUrl.pathname).test(item)
            );
            if (exist) return;
          }
          if (base64Encoded) {
            // base64 解码
            const bodyContent = Buffer.from(body, "base64").toString();
            this.responseMap[documentURL].push(bodyContent);
          } else {
            this.responseMap[documentURL].push(body);
          }

          this.logger.info(`在窗口中捕获视频链接: ${url}`);
          // 这里需要判断是否使用浏览器插件
          const useExtension = this.storeService.get("useExtension");
          if (useExtension) {
            const webContents = this.view.webContents;
            const item = await filter.handler.call(this, sourceParams);
            webContents.send("webview-link-message", item);
          } else {
            const item = await filter.handler.call(this, sourceParams);
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
        }
      }
    });

    this.debugger.sendCommand("Network.enable");
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
    } catch (err: unknown) {
      this.logger.error("加载 url 时出现错误: ", err);
      throw err;
    } finally {
      if (!canGoBack && !isNewWindow) {
        this.view.webContents.clearHistory();
      }
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

  setUserAgent(isMobile?: boolean) {
    if (isMobile) {
      this.view.webContents.setUserAgent(mobileUA);
    } else {
      this.view.webContents.setUserAgent(pcUA);
    }
    this.logger.info("设置 user-agent 成功", isMobile);
  }

  get debugger() {
    return this.view.webContents.debugger;
  }
}
