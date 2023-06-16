import {
  dialog,
  IpcMainEvent,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  shell,
} from "electron";
import { Favorite } from "entity/Favorite";
import { convertToAudio } from "helper";
import { db, workspace } from "helper/variables";
import { inject, injectable } from "inversify";
import { AppStore, BrowserStore, EnvPath } from "main";
import path from "path";
import { handle } from "../helper/decorator";
import {
  StoreService,
  LoggerService,
  type Controller,
  FavoriteRepository,
  MainWindowService,
  VideoRepository,
  BrowserWindowService,
  PlayerWindowService,
} from "../interfaces";
import { TYPES } from "../types";
import fs from "fs-extra";

@injectable()
export default class HomeController implements Controller {
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
    @inject(TYPES.FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
    @inject(TYPES.MainWindowService)
    private readonly mainWindow: MainWindowService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.BrowserWindowService)
    private readonly browserWindow: BrowserWindowService,
    @inject(TYPES.PlayerWindowService)
    private readonly playerWindow: PlayerWindowService
  ) {}

  @handle("get-env-path")
  async getEnvPath(): Promise<EnvPath> {
    return {
      binPath: __bin__,
      dbPath: db,
      workspace: workspace,
      platform: process.platform,
      local: this.storeService.get("local"),
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
    return this.storeService.store;
  }

  @handle("on-favorite-item-context-menu")
  async onFavoriteItemContextMenu(e: IpcMainEvent, id: number) {
    const send = (action: string) => {
      this.mainWindow.webContents.send("favorite-item-event", {
        action,
        payload: id,
      });
    };
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: "打开",
        click: () => {
          send("open");
        },
      },
      { type: "separator" },
      {
        label: "删除",
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
    const result = await dialog.showOpenDialog(this.mainWindow, {
      properties: ["openDirectory"],
    });

    if (!result.canceled) {
      const dir = result.filePaths[0];
      this.storeService.set("local", dir);
      return dir;
    }
    return "";
  }

  @handle("set-app-store")
  async setAppStore(e: IpcMainEvent, key: keyof AppStore, val: any) {
    if (key === "useProxy") {
      const proxy = this.storeService.get("proxy");
      await this.storeService.setProxy(val, proxy);
    } else if (key === "proxy") {
      if (this.storeService.get("useProxy")) {
        this.storeService.setProxy(true, val);
      }
    }

    this.storeService.set(key, val);
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
      this.mainWindow.webContents.send("download-item-event", {
        action,
        payload: id,
      });
    };
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: "选择",
        click: () => {
          send("select");
        },
      },
      {
        label: "下载",
        click: () => {
          send("download");
        },
      },
      {
        label: "刷新",
        click: () => {
          send("refresh");
        },
      },
      { type: "separator" },
      {
        label: "删除",
        click: () => {
          send("delete");
        },
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  @handle("convert-to-audio")
  async convertToAudio(e: IpcMainEvent, id: number) {
    const video = await this.videoRepository.findVideo(id);
    const local = this.storeService.get("local");
    const input = path.join(local, `${video?.name}.mp4`);
    const output = path.join(local, `${video?.name}.mp3`);

    const exist = await fs.exists(input);
    if (exist) {
      return await convertToAudio(input, output);
    } else {
      return Promise.reject("未找到文件，可能是文件已经删除");
    }
  }

  @handle("show-browser-window")
  async showBrowserWindow(event: IpcMainEvent, store: BrowserStore) {
    this.browserWindow.showWindow(store);
  }

  @handle("combine-to-home-page")
  async combineToHomePage() {
    // 关闭浏览器窗口
    this.browserWindow.hideWindow();
    // 修改设置中的属性
    this.storeService.set("openInNewWindow", false);
  }

  @handle("open-player-window")
  async openPlayerWindow(event: IpcMainEvent, id: number) {
    // 打开播放器窗口
    this.playerWindow.openWindow(id);
  }
}
