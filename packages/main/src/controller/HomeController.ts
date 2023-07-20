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
import { Favorite } from "entity/Favorite";
import { convertToAudio } from "helper";
import { db, workspace } from "helper";
import { inject, injectable } from "inversify";
import { AppStore, EnvPath } from "main";
import path from "path";
import { handle, getLocalIP } from "../helper";
import {
  StoreService,
  type Controller,
  FavoriteRepository,
  MainWindowService,
  VideoRepository,
  BrowserWindowService,
  PlayerWindowService,
  WebviewService,
} from "../interfaces";
import { TYPES } from "../types";
import fs from "fs-extra";

@injectable()
export default class HomeController implements Controller {
  private sharedState: Record<string, any> = {};

  constructor(
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
    private readonly playerWindow: PlayerWindowService,
    @inject(TYPES.WebviewService)
    private readonly webviewService: WebviewService
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
      const window = this.mainWindow.window;
      if (!window) return;
      window.webContents.send("favorite-item-event", {
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
    const window = this.mainWindow.window;
    if (!window) return Promise.reject("未找到主窗口");

    const result = await dialog.showOpenDialog(window, {
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
    // useProxy
    if (key === "useProxy") {
      const proxy = this.storeService.get("proxy");
      this.webviewService.setProxy(val, proxy);
    }
    // proxy
    if (key === "proxy") {
      const useProxy = this.storeService.get("useProxy");
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
      const window = this.mainWindow.window;
      if (!window) return;

      window.webContents.send("download-item-event", {
        action,
        payload: id,
      });
    };
    const item = await this.videoRepository.findVideo(id);
    const template: Array<MenuItemConstructorOptions | MenuItem> = [
      {
        label: "拷贝链接地址",
        click: () => {
          clipboard.writeText(item?.url || "");
        },
      },
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
  async showBrowserWindow() {
    this.browserWindow.showWindow();
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
}
