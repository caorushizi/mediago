import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { type Controller, DownloadStatus, i18n } from "@mediago/shared-common";
import {
  type AppStore,
  ConversionRepository,
  DownloadManagementService,
  type EnvPath,
  type Favorite,
  FavoriteManagementService,
  handle,
  TYPES,
} from "@mediago/shared-node";
import axios from "axios";
import {
  clipboard,
  dialog,
  type IpcMainEvent,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
  nativeTheme,
  shell,
} from "electron";
import fs from "fs-extra";
import { glob } from "glob";
import { inject, injectable } from "inversify";
import { nanoid } from "nanoid";
import { machineId } from "node-machine-id";
import { convertToAudio, db, getLocalIP, videoPattern, workspace } from "../helper/index";
import WebviewService from "../services/WebviewService";
import ElectronLogger from "../vendor/ElectronLogger";
import ElectronStore from "../vendor/ElectronStore";
import ElectronUpdater from "../vendor/ElectronUpdater";
import BrowserWindow from "../windows/BrowserWindow";
import MainWindow from "../windows/MainWindow";

@injectable()
@provide(TYPES.Controller)
export default class HomeController implements Controller {
  private sharedState: Record<string, unknown> = {};

  private readonly appStoreHandlers: Partial<{
    [K in keyof AppStore]: (value: AppStore[K]) => void | Promise<void>;
  }> = {
    useProxy: (value) => {
      const proxy = this.store.get("proxy");
      this.webviewService.setProxy(value, proxy);
    },
    proxy: (value) => {
      const useProxy = this.store.get("useProxy");
      if (useProxy) {
        this.webviewService.setProxy(true, value);
      }
    },
    blockAds: (value) => {
      this.webviewService.setBlocking(value);
    },
    theme: (value) => {
      nativeTheme.themeSource = value;
    },
    isMobile: (value) => {
      this.webviewService.setUserAgent(value);
    },
    privacy: (value) => {
      this.webviewService.setDefaultSession(value);
    },
    language: async (value) => {
      await i18n.changeLanguage(value);
    },
    allowBeta: (value) => {
      this.updater.changeAllowBeta(value);
    },
    audioMuted: (value) => {
      this.webviewService.setAudioMuted(value);
    },
  };

  constructor(
    @inject(ElectronStore)
    private readonly store: ElectronStore,
    @inject(TYPES.FavoriteManagementService)
    private readonly favoriteService: FavoriteManagementService,
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(TYPES.DownloadManagementService)
    private readonly downloadService: DownloadManagementService,
    @inject(BrowserWindow)
    private readonly browserWindow: BrowserWindow,
    @inject(WebviewService)
    private readonly webviewService: WebviewService,
    @inject(ConversionRepository)
    private readonly conversionRepository: ConversionRepository,
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(ElectronUpdater)
    private readonly updater: ElectronUpdater,
  ) {}

  @handle("get-env-path")
  async getEnvPath(): Promise<EnvPath> {
    return {
      binPath: __bin__,
      dbPath: db,
      workspace: workspace,
      platform: process.platform,
      local: this.store.get("local"),
    };
  }

  @handle("get-favorites")
  getFavorites() {
    return this.favoriteService.getFavorites();
  }

  @handle("add-favorite")
  addFavorite(e: IpcMainEvent, favorite: Favorite) {
    return this.favoriteService.addFavorite(favorite);
  }

  @handle("remove-favorite")
  removeFavorite(e: IpcMainEvent, id: number): Promise<void> {
    return this.favoriteService.removeFavorite(id);
  }

  @handle("get-app-store")
  getAppStore() {
    return this.store.store;
  }

  @handle("on-favorite-item-context-menu")
  async onFavoriteItemContextMenu(e: IpcMainEvent, id: number) {
    const send = (action: string) => {
      this.mainWindow.send("favorite-item-event", {
        action,
        payload: id,
      });
    };
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: i18n.t("open"),
        click: () => {
          send("open");
        },
      },
      { type: "separator" },
      {
        label: i18n.t("delete"),
        click: () => {
          send("delete");
        },
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  @handle("select-download-dir")
  async selectDownloadDir(): Promise<string> {
    const window = this.mainWindow.window;
    if (!window) return Promise.reject(i18n.t("noMainWindow"));

    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
    });

    if (!result.canceled) {
      const dir = result.filePaths[0];
      this.store.set("local", dir);
      return dir;
    }
    return "";
  }

  @handle("set-app-store")
  async setAppStore<K extends keyof AppStore>(_e: IpcMainEvent, key: K, val: AppStore[K]) {
    const handler = this.appStoreHandlers[key];
    if (handler) {
      await handler(val);
    }

    this.store.set(key, val);
  }

  @handle("open-dir")
  async openDir(_e: IpcMainEvent, dir: string) {
    await shell.openPath(dir);
  }

  @handle("open-url")
  async openUrl(e: IpcMainEvent, url: string) {
    await shell.openExternal(url);
  }

  @handle("on-download-list-context-menu")
  async downloadListContextMenu(e: IpcMainEvent, id: number) {
    const send = (action: string) => {
      this.mainWindow.send("download-item-event", {
        action,
        payload: id,
      });
    };
    const item = await this.downloadService.getDownloadItems({ current: 1, pageSize: 1 }, this.store.get("local"), "");
    const video = item.list.find((v: any) => v.id === id);
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: i18n.t("copyLinkAddress"),
        click: () => {
          clipboard.writeText(video?.url || "");
        },
      },
      {
        label: i18n.t("select"),
        click: () => {
          send("select");
        },
      },
      {
        label: i18n.t("download"),
        click: () => {
          send("download");
        },
      },
      {
        label: i18n.t("refresh"),
        click: () => {
          send("refresh");
        },
      },
      { type: "separator" },
      {
        label: i18n.t("delete"),
        click: () => {
          send("delete");
        },
      },
    ];

    if (video?.status === DownloadStatus.Success && video?.exists && video?.file) {
      template.unshift(
        {
          label: i18n.t("openFolder"),
          click: () => {
            shell.showItemInFolder(video.file!);
          },
        },
        {
          label: i18n.t("openFile"),
          click: () => {
            shell.openPath(video.file!);
          },
        },
        { type: "separator" },
      );
    }

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  @handle("convert-to-audio")
  async convertToAudio(e: IpcMainEvent, id: number) {
    const conversion = await this.conversionRepository.findConversion(id);
    const local = this.store.get("local");
    const input = conversion.path;
    const outName = `${path.basename(input, path.extname(input))}.mp3`;
    const output = path.join(local, outName);

    const exist = await fs.exists(input);
    if (exist) {
      return await convertToAudio(input, output);
    } else {
      return Promise.reject(i18n.t("noFileFound"));
    }
  }

  @handle("show-browser-window")
  async showBrowserWindow() {
    this.browserWindow.showWindow();
  }

  @handle("combine-to-home-page")
  async combineToHomePage() {
    // Close browser window
    this.browserWindow.hideWindow();
    // Modify the properties in the Settings
    this.store.set("openInNewWindow", false);
  }

  @handle("get-local-ip")
  async getLocalIp() {
    return getLocalIP();
  }

  @handle("get-shared-state")
  async getSharedState() {
    return this.sharedState;
  }

  @handle("set-shared-state")
  async setSharedState(event: IpcMainEvent, state: any) {
    this.sharedState = state;
  }

  @handle("get-download-log")
  async getDownloadLog(event: IpcMainEvent, id: number) {
    return await this.downloadService.getDownloadLog(id);
  }

  @handle("select-file")
  async selectFile() {
    const window = this.mainWindow.window;
    if (!window) return Promise.reject(i18n.t("noMainWindow"));

    const result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
    });

    if (!result.canceled) {
      return result.filePaths[0];
    }
    return "";
  }

  @handle("get-machine-id")
  async getMachineId() {
    try {
      const id = this.store.get("machineId");
      if (id) return id;
      const newId = await machineId();
      this.store.set("machineId", newId);
      return newId;
    } catch (e) {
      const id = this.store.get("machineId");
      if (id) return id;
      const newId = nanoid();
      this.store.set("machineId", newId);
      return newId;
    }
  }

  @handle("export-favorites")
  async exportFavorites() {
    const json = await this.favoriteService.exportFavorites();
    const window = this.mainWindow.window;
    if (!window) return Promise.reject(i18n.t("noMainWindow"));

    const result = await dialog.showSaveDialog(window, {
      title: i18n.t("exportFavorites"),
      defaultPath: "favorites.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (!result.canceled) {
      await fs.writeFile(result.filePath, json);
    }
  }

  @handle("import-favorites")
  async importFavorites() {
    const window = this.mainWindow.window;
    if (!window) return Promise.reject(i18n.t("noMainWindow"));

    const result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (!result.canceled) {
      const filePath = result.filePaths[0];
      const json = await fs.readJSON(filePath);
      await this.favoriteService.importFavorites(json);
    }
  }

  @handle("check-update")
  async checkUpdate() {
    this.updater.manualUpdate();
  }

  @handle("start-update")
  async startUpdate() {
    this.updater.startDownload();
  }

  @handle("install-update")
  async installUpdate() {
    this.updater.install();
  }

  @handle("export-download-list")
  async exportDownloadList() {
    const txt = await this.downloadService.exportDownloadList();
    const window = this.mainWindow.window;
    if (!window) return Promise.reject(i18n.t("noMainWindow"));

    const result = await dialog.showSaveDialog(window, {
      title: i18n.t("exportDownloadList"),
      defaultPath: "download-list.txt",
      filters: [{ name: "Text", extensions: ["txt"] }],
    });

    if (!result.canceled) {
      await fs.writeFile(result.filePath, txt);
    }
  }

  @handle("get-video-folders")
  async getVideoFolders() {
    return this.downloadService.getVideoFolders();
  }

  @handle("get-page-title")
  async getPageTitle(event: IpcMainEvent, url: string): Promise<{ data: string }> {
    try {
      console.log("Getting title for URL:", url);

      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const html = response.data;
      let title = "无标题";

      const patterns = [
        /<meta\s+property="og:title"\s+content="([^"]*)"/i,
        /<meta\s+name="title"\s+content="([^"]*)"/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          title = match[1].trim();
          console.log("Found title:", title);
          break;
        }
      }

      return { data: title };
    } catch (error) {
      console.error("Error fetching page title:", error);
      return { data: "无标题" };
    }
  }
}
