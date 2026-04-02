import { provide } from "@inversifyjs/binding-decorators";
import {
  CHECK_UPDATE,
  COMBINE_TO_HOME_PAGE,
  type Controller,
  EXPORT_DOWNLOAD_LIST,
  EXPORT_FAVORITES,
  EnvPath,
  GET_ENV_PATH,
  GET_SHARED_STATE,
  IMPORT_FAVORITES,
  INSTALL_UPDATE,
  ON_DOWNLOAD_LIST_CONTEXT_MENU,
  ON_FAVORITE_ITEM_CONTEXT_MENU,
  OPEN_DIR,
  OPEN_URL,
  SELECT_DOWNLOAD_DIR,
  SELECT_FILE,
  SET_SHARED_STATE,
  SHOW_BROWSER_WINDOW,
  START_UPDATE,
  safeParseJSON,
} from "@mediago/shared-common";
import { handle } from "../core/decorators";
import { i18n } from "../core/i18n";
import { DownloaderServer } from "../services/downloader.server";
import { VideoServer } from "../services/video.server";
import { TYPES } from "../types/symbols";
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
import { exePath, workspace } from "../utils";
import ElectronUpdater from "../vendor/ElectronUpdater";
import BrowserWindow from "../windows/browser.window";
import MainWindow from "../windows/main.window";

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

  @handle(GET_SHARED_STATE)
  async getSharedState() {
    return this.sharedState;
  }

  @handle(SET_SHARED_STATE)
  async setSharedState(event: IpcMainEvent, state: any) {
    this.sharedState = state;
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
      const favorites = safeParseJSON(content, []);
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
}
