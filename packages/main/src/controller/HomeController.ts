import { IpcMainEvent } from "electron";
import { Favorite } from "entity/Favorite";
import { db, workspace } from "helper/variables";
import { inject, injectable } from "inversify";
import { IndexData } from "main";
import { handle, on } from "../helper/decorator";
import {
  StoreService,
  LoggerService,
  type Controller,
  FavoriteRepository,
} from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class HomeController implements Controller {
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly store: StoreService,
    @inject(TYPES.FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository
  ) {
    // empty
  }

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
}
