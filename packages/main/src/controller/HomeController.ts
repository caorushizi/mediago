import {
  dialog,
  IpcMainEvent,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  nativeTheme,
  shell,
  clipboard,
} from "electron";
import {
  convertToAudio,
  db,
  videoPattern,
  workspace,
} from "../helper/index.ts";
import { inject, injectable } from "inversify";
import { AppStore, EnvPath } from "@mediago/shared/node";
import path from "path";
import { handle, getLocalIP } from "../helper/index.ts";
import { DownloadStatus, type Controller } from "@mediago/shared/common";
import { TYPES } from "@mediago/shared/node";
import fs from "fs-extra";
import MainWindow from "../windows/MainWindow.ts";
import BrowserWindow from "../windows/BrowserWindow.ts";
import ElectronStore from "../vendor/ElectronStore.ts";
import WebviewService from "../services/WebviewService.ts";
import {
  FavoriteRepository,
  VideoRepository,
  ConversionRepository,
  Favorite,
} from "@mediago/shared/node";
import { machineId } from "node-machine-id";
import { nanoid } from "nanoid";
import { glob } from "glob";
import { i18n } from "@mediago/shared/common";
import ElectronLogger from "../vendor/ElectronLogger.ts";
import ElectronUpdater from "../vendor/ElectronUpdater.ts";
import axios from "axios";

@injectable()
export default class HomeController implements Controller {
  private sharedState: Record<string, unknown> = {};

  constructor(
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore,
    @inject(TYPES.FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
    @inject(TYPES.MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.BrowserWindow)
    private readonly browserWindow: BrowserWindow,
    @inject(TYPES.WebviewService)
    private readonly webviewService: WebviewService,
    @inject(TYPES.ConversionRepository)
    private readonly conversionRepository: ConversionRepository,
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(TYPES.ElectronUpdater)
    private readonly updater: ElectronUpdater
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
    return this.favoriteRepository.findFavorites();
  }

  @handle("add-favorite")
  addFavorite(e: IpcMainEvent, favorite: Favorite) {
    return this.favoriteRepository.addFavorite(favorite);
  }

  @handle("remove-favorite")
  removeFavorite(e: IpcMainEvent, id: number): Promise<void> {
    return this.favoriteRepository.removeFavorite(id);
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
  async setAppStore(e: IpcMainEvent, key: keyof AppStore, val: any) {
    // useProxy
    if (key === "useProxy") {
      const proxy = this.store.get("proxy");
      this.webviewService.setProxy(val, proxy);
    }
    // proxy
    if (key === "proxy") {
      const useProxy = this.store.get("useProxy");
      useProxy && this.webviewService.setProxy(true, val);
    }
    // block
    if (key === "blockAds") {
      this.webviewService.setBlocking(val);
    }
    // theme
    if (key === "theme") {
      nativeTheme.themeSource = val;
    }
    // isMobile
    if (key === "isMobile") {
      this.webviewService.setUserAgent(val);
    }
    // privacy
    if (key === "privacy") {
      this.webviewService.setDefaultSession(val);
    }
    // language
    if (key === "language") {
      i18n.changeLanguage(val);
    }
    // allowBeta
    if (key === "allowBeta") {
      this.updater.changeAllowBeta(val);
    }
    // audio muted mode
    if (key === "audioMuted") {
      this.webviewService.setAudioMuted(val);
    }

    this.store.set(key, val);
  }

  @handle("open-dir")
  async openDir(e: IpcMainEvent, dir: string) {
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
    const item = await this.videoRepository.findVideo(id);
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: i18n.t("copyLinkAddress"),
        click: () => {
          clipboard.writeText(item.url || "");
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

    if (item.status === DownloadStatus.Success) {
      const local = this.store.get("local");
      const pattern = path.join(local, `${item.name}.{${videoPattern}}`);
      const files = await glob(pattern);
      const exists = files.length > 0;
      if (exists) {
        const file = files[0];
        template.unshift(
          {
            label: i18n.t("openFolder"),
            click: () => {
              shell.showItemInFolder(file);
            },
          },
          {
            label: i18n.t("openFile"),
            click: () => {
              shell.openPath(file);
            },
          },
          { type: "separator" }
        );
      }
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
    const video = await this.videoRepository.findVideo(id);
    return video.log || "";
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
    const favorites = await this.favoriteRepository.findFavorites();
    const json = JSON.stringify(
      favorites.map((i) => ({
        title: i.title,
        url: i.url,
        icon: i.icon,
      })),
      null,
      2
    );
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
      await this.favoriteRepository.importFavorites(json);
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
    const videos = await this.videoRepository.findAllVideos();

    const txt = videos.map((video) => `${video.url} ${video.name}`).join("\n");
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
    return this.videoRepository.getVideoFolders();
  }

  @handle("get-page-title")
  async getPageTitle(
    event: IpcMainEvent,
    url: string
  ): Promise<{ data: string }> {
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
