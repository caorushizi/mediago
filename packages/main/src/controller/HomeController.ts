import { dialog, IpcMainEvent, shell } from "electron";
import { Favorite } from "entity/Favorite";
import { db, workspace } from "helper/variables";
import { inject, injectable } from "inversify";
import { AppStore, EnvPath } from "main";
import { handle } from "../helper/decorator";
import {
  StoreService,
  LoggerService,
  type Controller,
  FavoriteRepository,
  MainWindowService,
} from "../interfaces";
import { TYPES } from "../types";

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
    private readonly mainWindow: MainWindowService
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
  removeFavorite(e: IpcMainEvent, url: string): Promise<void> {
    return this.favoriteRepository.removeFavorite(url);
  }

  @handle("get-app-store")
  getAppStore() {
    return this.storeService.store;
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
}
