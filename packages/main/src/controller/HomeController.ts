import { dialog, IpcMainEvent } from "electron";
import { Favorite } from "entity/Favorite";
import { db, workspace } from "helper/variables";
import { inject, injectable } from "inversify";
import { AppStore, IndexData } from "main";
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

  @handle("index")
  async index(): Promise<IndexData> {
    return {
      binPath: __bin__,
      dbPath: db,
      workspace: workspace,
      platform: process.platform,
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
    console.log("key", key, val);

    if (key === "useProxy") {
      await this.storeService.setProxy(val);
    }

    this.storeService.set(key, val);
  }
}
