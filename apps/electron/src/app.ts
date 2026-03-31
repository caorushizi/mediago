import { resolve } from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { i18n } from "./core/i18n";
import { DownloaderServer } from "./services/downloader.server";
import { VideoServer } from "./services/video.server";
import {
  app,
  BrowserWindow,
  type Event,
  Menu,
  nativeImage,
  nativeTheme,
  Tray,
} from "electron";
import { inject, injectable } from "inversify";
import TrayIcon from "../assets/icon.ico";
import TrayPng from "../assets/icon.png";
import ProtocolService from "./core/protocol";
import ElectronRouter from "./core/router";
import { db, isMac, logDir } from "./constants";
import ElectronDevtools from "./vendor/ElectronDevtools";
import ElectronUpdater from "./vendor/ElectronUpdater";
import GoConfigCache from "./services/go-config-cache";
import WebviewService from "./services/webview.service";
import BrowserWindowService from "./windows/browser.window";
import MainWindow from "./windows/main.window";
import "./controller";

@injectable()
@provide()
export default class ElectronApp {
  constructor(
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(ProtocolService)
    private readonly protocol: ProtocolService,
    @inject(ElectronUpdater)
    private readonly updater: ElectronUpdater,
    @inject(ElectronRouter)
    private readonly router: ElectronRouter,
    @inject(ElectronDevtools)
    private readonly devTools: ElectronDevtools,
    @inject(VideoServer)
    private readonly videoServer: VideoServer,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
    @inject(WebviewService)
    private readonly webviewService: WebviewService,
    @inject(GoConfigCache)
    private readonly configCache: GoConfigCache,
    @inject(BrowserWindowService)
    private readonly browserWindow: BrowserWindowService,
  ) {}

  private async serviceInit(): Promise<void> {
    this.mainWindow.init();
  }

  private async vendorInit() {
    this.updater.init();
    this.devTools.init();
  }

  async init(): Promise<void> {
    this.protocol.create();
    this.router.init();

    // 1. Start Go download service (reads config from its own conf file)
    await this.downloaderServer.start({
      logDir: logDir,
      dbPath: db,
    });

    // 2. Read config from Go (single source of truth) and seed cache
    const client = this.downloaderServer.getClient();
    const { data: config } = await client.getConfig();
    this.configCache.seed(config);

    // 3. Apply initial config
    nativeTheme.themeSource = config.theme || "system";
    i18n.changeLanguage(config.language);
    this.videoServer.start({
      local: config.local,
      enableMobilePlayer: config.enableMobilePlayer,
    });

    // 4. Initialize vendors and services (can now read from configCache)
    await this.vendorInit();
    await this.serviceInit();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow.init();
      }
    });

    this.initTray();

    // 5. Listen for Go config changes → update cache + platform side effects + IPC to UI
    this.downloaderServer.on(
      "config-changed",
      (key: string, value: unknown) => {
        this.configCache.update(key, value);

        // Forward to UI windows
        this.mainWindow.send("config-changed", { key, value });
        this.browserWindow.send("config-changed", { key, value });

        // Platform side effects
        const handlers: Record<string, (v: any) => void> = {
          theme: (v) => {
            nativeTheme.themeSource = v;
          },
          useProxy: (v) => {
            this.webviewService.setProxy(v, this.configCache.get("proxy"));
          },
          proxy: (v) => {
            this.webviewService.setProxy(this.configCache.get("useProxy"), v);
          },
          blockAds: (v) => {
            this.webviewService.setBlocking(v);
          },
          isMobile: (v) => {
            this.webviewService.setUserAgent(v);
          },
          privacy: (v) => {
            this.webviewService.setDefaultSession(v);
          },
          language: (v) => {
            i18n.changeLanguage(v);
          },
          allowBeta: (v) => {
            this.updater.changeAllowBeta(v);
          },
          audioMuted: (v) => {
            this.webviewService.setAudioMuted(v);
          },
          enableMobilePlayer: (v) => {
            this.videoServer.enableMobilePlayer(v);
          },
        };
        handlers[key]?.(value);
      },
    );
  }

  initTray() {
    let trayIcon = nativeImage.createFromPath(resolve(__dirname, TrayIcon));
    if (isMac) {
      trayIcon = nativeImage
        .createFromPath(resolve(__dirname, TrayPng))
        .resize({ width: 18, height: 18 });
    }

    const tray = new Tray(trayIcon);
    tray.setToolTip("Media Go");
    tray.addListener("click", () => {
      this.mainWindow.init();
    });
    const contextMenu = Menu.buildFromTemplate([
      {
        label: i18n.t("showMainWindow"),
        click: () => this.mainWindow.init(),
      },
      {
        label: i18n.t("exitApp"),
        role: "quit",
      },
    ]);
    tray.setContextMenu(contextMenu);
  }

  secondInstance = (event: Event, commandLine: string[]) => {
    const url = commandLine.pop() || "";
    this.mainWindow.showWindow(url);
  };
}
