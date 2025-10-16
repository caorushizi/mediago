import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import {
  ADD_FAVORITE,
  CHECK_UPDATE,
  COMBINE_TO_HOME_PAGE,
  CONVERT_TO_AUDIO,
  type Controller,
  DownloadStatus,
  EXPORT_DOWNLOAD_LIST,
  EXPORT_FAVORITES,
  GET_APP_STORE,
  GET_DOWNLOAD_LOG,
  GET_ENV_PATH,
  GET_FAVORITES,
  GET_LOCAL_IP,
  GET_MACHINE_ID,
  GET_PAGE_TITLE,
  GET_SHARED_STATE,
  GET_VIDEO_FOLDERS,
  IMPORT_FAVORITES,
  INSTALL_UPDATE,
  ON_DOWNLOAD_LIST_CONTEXT_MENU,
  ON_FAVORITE_ITEM_CONTEXT_MENU,
  OPEN_DIR,
  OPEN_URL,
  REMOVE_FAVORITE,
  SELECT_DOWNLOAD_DIR,
  SELECT_FILE,
  SET_APP_STORE,
  SET_SHARED_STATE,
  SHOW_BROWSER_WINDOW,
  START_UPDATE,
} from "@mediago/shared-common";
import {
  type AppStore,
  type ConversionService,
  DownloadTaskService,
  type EnvPath,
  type Favorite,
  type FavoriteManagementService,
  getLocalIP,
  handle,
  i18n,
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
import { inject, injectable } from "inversify";
import { nanoid } from "nanoid";
import { machineId } from "node-machine-id";
import { convertToAudio, db, workspace } from "../helper/index";
import WebviewService from "../services/webview.service";
import ElectronLogger from "../vendor/ElectronLogger";
import ElectronStore from "../vendor/ElectronStore";
import ElectronUpdater from "../vendor/ElectronUpdater";
import BrowserWindow from "../windows/browser.window";
import MainWindow from "../windows/main.window";

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
    @inject(DownloadTaskService)
    private readonly downloadTaskService: DownloadTaskService,
    @inject(BrowserWindow)
    private readonly browserWindow: BrowserWindow,
    @inject(WebviewService)
    private readonly webviewService: WebviewService,
    @inject(TYPES.ConversionService)
    private readonly conversionService: ConversionService,
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(ElectronUpdater)
    private readonly updater: ElectronUpdater,
  ) {}

  @handle(GET_ENV_PATH)
  async getEnvPath(): Promise<EnvPath> {
    return {
      binPath: __bin__,
      dbPath: db,
      workspace: workspace,
      platform: process.platform,
      local: this.store.get("local"),
    };
  }

  @handle(GET_FAVORITES)
  getFavorites() {
    return this.favoriteService.getFavorites();
  }

  @handle(ADD_FAVORITE)
  addFavorite(e: IpcMainEvent, favorite: Favorite) {
    return this.favoriteService.addFavorite(favorite);
  }

  @handle(REMOVE_FAVORITE)
  removeFavorite(e: IpcMainEvent, id: number): Promise<void> {
    return this.favoriteService.removeFavorite(id);
  }

  @handle(GET_APP_STORE)
  getAppStore() {
    return this.store.store;
  }

  @handle(ON_FAVORITE_ITEM_CONTEXT_MENU)
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

  @handle(SELECT_DOWNLOAD_DIR)
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

  @handle(SET_APP_STORE)
  async setAppStore<K extends keyof AppStore>(_e: IpcMainEvent, key: K, val: AppStore[K]) {
    const handler = this.appStoreHandlers[key];
    if (handler) {
      await handler(val);
    }

    this.store.set(key, val);
  }

  @handle(OPEN_DIR)
  async openDir(_e: IpcMainEvent, dir: string) {
    await shell.openPath(dir);
  }

  @handle(OPEN_URL)
  async openUrl(e: IpcMainEvent, url: string) {
    await shell.openExternal(url);
  }

  @handle(ON_DOWNLOAD_LIST_CONTEXT_MENU)
  async downloadListContextMenu(e: IpcMainEvent, id: number) {
    const send = (action: string) => {
      this.mainWindow.send("download-item-event", {
        action,
        payload: id,
      });
    };
    const item = await this.downloadTaskService.list({ current: 1, pageSize: 1 }, this.store.get("local"), "");
    const task = item.list.find((t: any) => t.id === id);
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: i18n.t("copyLinkAddress"),
        click: () => {
          clipboard.writeText(task?.url || "");
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

    if (task?.status === DownloadStatus.Success && task?.exists && task?.file) {
      template.unshift(
        {
          label: i18n.t("openFolder"),
          click: () => {
            shell.showItemInFolder(task.file!);
          },
        },
        {
          label: i18n.t("openFile"),
          click: () => {
            shell.openPath(task.file!);
          },
        },
        { type: "separator" },
      );
    }

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  @handle(CONVERT_TO_AUDIO)
  async convertToAudio(e: IpcMainEvent, id: number) {
    const conversion = await this.conversionService.findByIdOrFail(id);
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

  @handle(SHOW_BROWSER_WINDOW)
  async showBrowserWindow() {
    this.browserWindow.showWindow();
  }

  @handle(COMBINE_TO_HOME_PAGE)
  async combineToHomePage() {
    // Close browser window
    this.browserWindow.hideWindow();
    // Modify the properties in the Settings
    this.store.set("openInNewWindow", false);
  }

  @handle(GET_LOCAL_IP)
  async getLocalIp() {
    return getLocalIP();
  }

  @handle(GET_SHARED_STATE)
  async getSharedState() {
    return this.sharedState;
  }

  @handle(SET_SHARED_STATE)
  async setSharedState(event: IpcMainEvent, state: any) {
    this.sharedState = state;
  }

  @handle(GET_DOWNLOAD_LOG)
  async getDownloadLog(event: IpcMainEvent, id: number) {
    return await this.downloadTaskService.getLog(id);
  }

  @handle(SELECT_FILE)
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

  @handle(GET_MACHINE_ID)
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

  @handle(EXPORT_FAVORITES)
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

  @handle(IMPORT_FAVORITES)
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

  @handle(CHECK_UPDATE)
  async checkUpdate() {
    this.updater.manualUpdate();
  }

  @handle(START_UPDATE)
  async startUpdate() {
    this.updater.startDownload();
  }

  @handle(INSTALL_UPDATE)
  async installUpdate() {
    this.updater.install();
  }

  @handle(EXPORT_DOWNLOAD_LIST)
  async exportDownloadList() {
    const txt = await this.downloadTaskService.exportList();
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

  @handle(GET_VIDEO_FOLDERS)
  async getVideoFolders() {
    return this.downloadTaskService.listFolders();
  }

  @handle(GET_PAGE_TITLE)
  async getPageTitle(event: IpcMainEvent, url: string): Promise<{ data: string }> {
    try {
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
