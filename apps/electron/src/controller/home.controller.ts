import { provide } from "@inversifyjs/binding-decorators";
import {
  ADD_FAVORITE,
  AppStore,
  CHECK_UPDATE,
  COMBINE_TO_HOME_PAGE,
  CONVERT_TO_AUDIO,
  type Controller,
  EXPORT_DOWNLOAD_LIST,
  EXPORT_FAVORITES,
  EnvPath,
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
  safeParseJSON,
} from "@mediago/shared-common";
import {
  DownloaderServer,
  getLocalIP,
  getPageTitle,
  handle,
  i18n,
  randomName,
  TYPES,
  VideoServer,
} from "@mediago/shared-node";
import {
  dialog,
  type IpcMainEvent,
  Menu,
  type MenuItem,
  type MenuItemConstructorOptions,
  shell,
} from "electron";
import fs from "node:fs/promises";
import { inject, injectable } from "inversify";
import { nanoid } from "nanoid";
import MachineId from "node-machine-id";
import { convertToAudio, exePath, workspace } from "../utils";
import ElectronUpdater from "../vendor/ElectronUpdater";
import BrowserWindow from "../windows/browser.window";
import MainWindow from "../windows/main.window";

const { machineId } = MachineId;

@injectable()
@provide(TYPES.Controller)
export default class HomeController implements Controller {
  private sharedState: Record<string, unknown> = {};

  constructor(
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(BrowserWindow)
    private readonly browserWindow: BrowserWindow,
    @inject(ElectronUpdater)
    private readonly updater: ElectronUpdater,
    @inject(VideoServer)
    private readonly videoServer: VideoServer,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {}

  @handle(GET_ENV_PATH)
  async getEnvPath(): Promise<EnvPath> {
    const client = this.downloaderServer.getClient();
    const { data: config } = await client.getConfig();
    return {
      binPath: exePath,
      dbPath: "",
      workspace: workspace,
      platform: process.platform,
      local: config.local,
      playerUrl: this.videoServer.getURL() ?? "",
      coreUrl: (await this.downloaderServer.getURL()) ?? "",
    };
  }

  @handle(GET_FAVORITES)
  async getFavorites() {
    const client = this.downloaderServer.getClient();
    const res = await client.getFavorites();
    return res.data;
  }

  @handle(ADD_FAVORITE)
  async addFavorite(
    _e: IpcMainEvent,
    favorite: { title: string; url: string; icon?: string },
  ) {
    const client = this.downloaderServer.getClient();
    const res = await client.addFavorite(favorite);
    return res.data;
  }

  @handle(REMOVE_FAVORITE)
  async removeFavorite(_e: IpcMainEvent, id: number): Promise<void> {
    const client = this.downloaderServer.getClient();
    await client.removeFavorite(id);
  }

  @handle(GET_APP_STORE)
  async getAppStore() {
    const client = this.downloaderServer.getClient();
    const res = await client.getConfig();
    return res.data;
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
      const client = this.downloaderServer.getClient();
      await client.setConfigKey("local", dir);
      return dir;
    }
    return "";
  }

  @handle(SET_APP_STORE)
  async setAppStore<K extends keyof AppStore>(
    _e: IpcMainEvent,
    key: K,
    val: AppStore[K],
  ) {
    const client = this.downloaderServer.getClient();
    await client.setConfigKey(String(key), val);
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
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
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

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  @handle(CONVERT_TO_AUDIO)
  async convertToAudio(_e: IpcMainEvent, id: number) {
    const client = this.downloaderServer.getClient();
    const res = await client.getConversion(id);
    const conversion = res.data;
    if (conversion?.path) {
      await convertToAudio(conversion.path);
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
    const client = this.downloaderServer.getClient();
    await client.setConfigKey("openInNewWindow", false);
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
  async getDownloadLog(_event: IpcMainEvent, id: number) {
    const client = this.downloaderServer.getClient();
    const res = await client.getDownloadLogs(id);
    return res.data.log;
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
    const client = this.downloaderServer.getClient();
    try {
      const { data: config } = await client.getConfig();
      if (config.machineId) return config.machineId;
      const newId = await machineId();
      await client.setConfigKey("machineId", newId);
      return newId;
    } catch {
      const { data: config } = await client.getConfig();
      if (config.machineId) return config.machineId;
      const newId = nanoid();
      await client.setConfigKey("machineId", newId);
      return newId;
    }
  }

  @handle(EXPORT_FAVORITES)
  async exportFavorites() {
    const window = this.mainWindow.window;
    if (!window) return;

    const client = this.downloaderServer.getClient();
    const res = await client.exportFavorites();
    const content = res.data;

    const result = await dialog.showSaveDialog(window, {
      defaultPath: "favorites.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, content, "utf-8");
    }
  }

  @handle(IMPORT_FAVORITES)
  async importFavorites() {
    const window = this.mainWindow.window;
    if (!window) return;

    const result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (!result.canceled && result.filePaths[0]) {
      const content = await fs.readFile(result.filePaths[0], "utf-8");
      const favorites = safeParseJSON(content);
      if (Array.isArray(favorites)) {
        const client = this.downloaderServer.getClient();
        await client.importFavorites(favorites);
      }
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
    const window = this.mainWindow.window;
    if (!window) return;

    const client = this.downloaderServer.getClient();
    const res = await client.exportDownloadList();
    const content = res.data;

    const result = await dialog.showSaveDialog(window, {
      defaultPath: "downloads.txt",
      filters: [{ name: "Text", extensions: ["txt"] }],
    });

    if (!result.canceled && result.filePath) {
      await fs.writeFile(result.filePath, content, "utf-8");
    }
  }

  @handle(GET_VIDEO_FOLDERS)
  async getVideoFolders() {
    const client = this.downloaderServer.getClient();
    const res = await client.getDownloadFolders();
    return res.data;
  }

  @handle(GET_PAGE_TITLE)
  async getPageTitle(
    event: IpcMainEvent,
    url: string,
  ): Promise<{ data: string }> {
    const fallbackTitle = randomName();
    const title = await getPageTitle(url, fallbackTitle);
    return { data: title };
  }
}
