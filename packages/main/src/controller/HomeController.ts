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
import { Favorite } from "../entity/Favorite.ts";
import { convertToAudio, db, workspace } from "../helper/index.ts";
import { inject, injectable } from "inversify";
import { AppStore, EnvPath } from "../main.ts";
import path from "path";
import { handle, getLocalIP } from "../helper/index.ts";
import { type Controller } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import fs from "fs-extra";
import MainWindow from "../windows/MainWindow.ts";
import BrowserWindow from "../windows/BrowserWindow.ts";
import ElectronStore from "../vendor/ElectronStore.ts";
import WebviewService from "../services/WebviewService.ts";
import FavoriteRepository from "../repository/FavoriteRepository.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import ConversionRepository from "../repository/ConversionRepository.ts";
import { machineId } from "node-machine-id";
import { nanoid } from "nanoid";

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
    private readonly conversionRepository: ConversionRepository
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
        label: "拷贝链接地址",
        click: () => {
          clipboard.writeText(item.url || "");
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
    const conversion = await this.conversionRepository.findConversion(id);
    const local = this.store.get("local");
    const input = conversion.path;
    const outName = `${path.basename(input, path.extname(input))}.mp3`;
    const output = path.join(local, outName);

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
    if (!window) return Promise.reject("未找到主窗口");

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
}
