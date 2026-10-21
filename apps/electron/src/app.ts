import { resolve } from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { i18n } from "./core/i18n";
import { DownloaderServer } from "./services/downloader.server";
import {
  app,
  BrowserWindow,
  type Input,
  Menu,
  nativeImage,
  nativeTheme,
  Tray,
  type WebContents,
} from "electron";
import { inject, injectable } from "inversify";
import TrayIcon from "../assets/tray.ico";
import TrayIconPng from "../assets/tray.png";
import TrayIconPng2x from "../assets/tray@2x.png";
import TrayTemplate from "../assets/trayTemplate.png";
import TrayTemplate2x from "../assets/trayTemplate@2x.png";
import ProtocolService from "./core/protocol";
import ElectronRouter from "./core/router";
import { db, isMac, logDir } from "./constants";
import ElectronDevtools from "./vendor/ElectronDevtools";
import ElectronUpdater from "./vendor/ElectronUpdater";
import GoConfigCache from "./services/go-config-cache";
import OverlayDialogService from "./services/overlay-dialog.service";
import BrowserTabManagerService from "./services/browser-tab-manager.service";
import BrowserWindowService from "./windows/browser.window";
import MainWindow from "./windows/main.window";
import "./controller";
import ElectronLogger from "./vendor/ElectronLogger";
import { AppTheme, IpcEvent, resolveAppLanguage } from "@mediago/common";
import { installApplicationMenu as installNativeApplicationMenu } from "./core/application-menu";
import ShareIntentService from "./services/share-intent.service";
import { getPreferredSystemLanguage } from "./core/system-language";
import { getBrowserRefreshShortcut } from "./services/browser-refresh-shortcut";

@injectable()
@provide()
export default class ElectronApp {
  private tray?: Tray;
  private externalPresentationPending = false;
  private readonly shortcutBoundContents = new WeakSet<WebContents>();

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
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
    @inject(BrowserTabManagerService)
    private readonly browserTabs: BrowserTabManagerService,
    @inject(OverlayDialogService)
    private readonly overlayDialogService: OverlayDialogService,
    @inject(GoConfigCache)
    private readonly configCache: GoConfigCache,
    @inject(BrowserWindowService)
    private readonly browserWindow: BrowserWindowService,
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(ShareIntentService)
    private readonly shareIntentService: ShareIntentService,
  ) {}

  private async serviceInit(): Promise<void> {
    this.mainWindow.init();
    this.bindMainWindowBrowserShortcuts();
    this.overlayDialogService.init();
    this.browserTabs.reparentActiveView();
  }

  private readonly installApplicationMenu = () => {
    installNativeApplicationMenu({
      reloadVisibleBrowser: (ignoreCache) =>
        this.browserTabs.reloadActiveVisibleTab(ignoreCache),
    });
  };

  private bindMainWindowBrowserShortcuts(): void {
    const webContents = this.mainWindow.window?.webContents;
    if (!webContents || this.shortcutBoundContents.has(webContents)) return;
    this.shortcutBoundContents.add(webContents);
    webContents.on("before-input-event", (event, input: Input) => {
      const shortcut = getBrowserRefreshShortcut(input);
      if (
        !shortcut ||
        !this.browserTabs.reloadActiveVisibleTab(shortcut === "force-reload")
      ) {
        return;
      }
      event.preventDefault();
    });
  }
  handleExternalCommandLine(
    commandLine: readonly string[],
    present = true,
  ): boolean {
    const result = this.shareIntentService.handleCommandLine(commandLine);
    return this.acceptExternalInvocation(result.handled, present);
  }

  handleSecondInstance(
    commandLine: readonly string[],
    present = true,
  ): boolean {
    const handled = this.handleExternalCommandLine(commandLine, present);
    if (!handled && present) this.mainWindow.showWindow();
    return handled;
  }

  handleExternalUrl(url: string, present = true): boolean {
    const result = this.shareIntentService.handleProtocolUrl(url);
    return this.acceptExternalInvocation(result.handled, present);
  }

  presentPendingExternalInvocations() {
    if (!this.externalPresentationPending) return;
    this.externalPresentationPending = false;
    this.mainWindow.showWindow();
    if (this.shareIntentService.hasPending()) {
      this.mainWindow.send(IpcEvent.app.shareIntentAvailable);
    }
  }

  private acceptExternalInvocation(handled: boolean, present: boolean) {
    if (!handled) return false;
    this.externalPresentationPending = true;
    if (present) this.presentPendingExternalInvocations();
    return true;
  }

  private async vendorInit() {
    this.devTools.init();
  }

  async init(): Promise<void> {
    this.protocol.create();
    this.router.init();
    this.installApplicationMenu();

    // 1. Show the window immediately — must happen regardless of backend status
    await this.vendorInit();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow.init();
        this.bindMainWindowBrowserShortcuts();
        this.browserTabs.reparentActiveView();
      }
    });

    try {
      this.initTray();
    } catch (err) {
      this.logger.error("[ElectronApp] Failed to initialize system tray:", err);
    }
    i18n.on("languageChanged", () => {
      this.installApplicationMenu();
      this.refreshTrayMenu();
    });

    // 2. Start Go download service in the background; errors are non-fatal
    let updaterConfig = { allowBeta: false, autoUpgrade: true };
    try {
      await this.downloaderServer.start({
        logDir: logDir,
        dbPath: db,
      });

      // 3. Read config from Go (single source of truth) and seed cache
      const client = this.downloaderServer.getClient();
      const { data: config } = await client.getConfig();
      this.configCache.seed(config as any);
      if (config.blockAds) {
        this.browserTabs.setBlocking(true);
      }
      updaterConfig = {
        allowBeta: Boolean(config.allowBeta),
        autoUpgrade: config.autoUpgrade !== false,
      };

      // 4. Apply initial config
      nativeTheme.themeSource = (config.theme || "system") as AppTheme;
      i18n.changeLanguage(
        resolveAppLanguage(config.language, getPreferredSystemLanguage()),
      );
    } catch (err) {
      this.logger.error("[ElectronApp] Failed to start Go core service:", err);
    }

    this.updater.init(updaterConfig);

    // 5. Listen for Go config changes → update cache + platform side effects + IPC to UI
    this.downloaderServer.on(
      "config-changed",
      (key: string, value: unknown) => {
        this.configCache.update(key, value);

        // Forward to UI windows
        this.mainWindow.send("config:changed", { key, value });
        this.browserWindow.send("config:changed", { key, value });

        // Platform side effects
        const handlers: Record<string, (v: any) => void> = {
          theme: (v) => {
            nativeTheme.themeSource = v;
          },
          useProxy: (v) => {
            this.browserTabs.setProxy(v, this.configCache.get("proxy"));
          },
          proxy: (v) => {
            this.browserTabs.setProxy(this.configCache.get("useProxy"), v);
          },
          blockAds: (v) => {
            this.browserTabs.setBlocking(v);
          },
          privacy: (v) => {
            this.browserTabs.setDefaultSession(v);
          },
          language: (v) => {
            i18n.changeLanguage(
              resolveAppLanguage(v as string, getPreferredSystemLanguage()),
            );
          },
          allowBeta: (v) => {
            this.updater.changeAllowBeta(v);
          },
          autoUpgrade: (v) => {
            this.updater.changeAutoUpgrade(v);
          },
          audioMuted: (v) => {
            this.browserTabs.setAudioMuted(v);
          },
        };
        handlers[key]?.(value);
      },
    );

    await this.serviceInit();
    this.presentPendingExternalInvocations();
  }

  async shutdown(): Promise<void> {
    this.browserTabs.destroy();
    await this.downloaderServer.stop();
  }

  initTray() {
    let trayIcon;
    if (process.platform === "win32") {
      trayIcon = nativeImage.createFromPath(resolve(__dirname, TrayIcon));
    } else {
      const oneX = isMac ? TrayTemplate : TrayIconPng;
      const twoX = isMac ? TrayTemplate2x : TrayIconPng2x;
      trayIcon = nativeImage.createEmpty();
      trayIcon.addRepresentation({
        scaleFactor: 1,
        dataURL: nativeImage
          .createFromPath(resolve(__dirname, oneX))
          .toDataURL(),
      });
      trayIcon.addRepresentation({
        scaleFactor: 2,
        dataURL: nativeImage
          .createFromPath(resolve(__dirname, twoX))
          .toDataURL(),
      });
    }
    if (isMac) {
      trayIcon.setTemplateImage(true);
    }

    const tray = new Tray(trayIcon);
    tray.setToolTip("Media Go");
    tray.addListener("click", () => {
      this.mainWindow.showWindow();
    });
    this.tray = tray;
    this.refreshTrayMenu();
  }

  private refreshTrayMenu() {
    if (!this.tray) return;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: i18n.t("showMainWindow"),
        click: () => this.mainWindow.showWindow(),
      },
      {
        label: i18n.t("exitApp", { applicationName: app.name }),
        role: "quit",
      },
    ]);
    this.tray.setContextMenu(contextMenu);
  }
}
