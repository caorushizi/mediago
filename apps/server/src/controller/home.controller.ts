import { provide } from "@inversifyjs/binding-decorators";
import {
  type Controller,
  ADD_FAVORITE,
  EnvPath,
  EXPORT_FAVORITES,
  GET_APP_STORE,
  GET_ENV_PATH,
  GET_FAVORITES,
  GET_PAGE_TITLE,
  IMPORT_FAVORITES,
  REMOVE_FAVORITE,
  SET_APP_STORE,
  SOCKET_TEST,
} from "@mediago/shared-common";
import {
  type Favorite,
  type FavoriteManagementService,
  getPageTitle,
  handle,
  randomName,
  TYPES,
  VideoServer,
} from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import Logger from "../vendor/Logger";
import SocketIO from "../vendor/SocketIO";
import StoreService from "../vendor/Store";
import { BIN_DIR, DB_PATH, WORKSPACE } from "../helper";

@injectable()
@provide(TYPES.Controller)
export default class HomeController implements Controller {
  constructor(
    @inject(TYPES.FavoriteManagementService)
    private readonly favoriteService: FavoriteManagementService,
    @inject(Logger)
    private readonly logger: Logger,
    @inject(StoreService)
    private readonly store: StoreService,
    @inject(SocketIO)
    private readonly socket: SocketIO,
    @inject(VideoServer)
    private readonly videoServer: VideoServer,
  ) {}

  @handle(GET_ENV_PATH)
  async getEnvPath(): Promise<EnvPath> {
    return {
      binPath: BIN_DIR,
      dbPath: DB_PATH,
      workspace: WORKSPACE,
      platform: process.platform,
      local: this.store.get("local"),
      playerUrl: this.videoServer.getURL(),
    };
  }

  @handle(GET_APP_STORE)
  async getAppStore() {
    const store = await this.store.store;
    return store;
  }

  @handle(SET_APP_STORE)
  async setAppStore(params: { key: string; val: any }) {
    this.store.set(params.key, params.val);
    this.logger.info("set app store");
    return false;
  }

  @handle(SOCKET_TEST)
  async socketTest({ message }: { message: string }) {
    this.logger.info(message);

    this.socket.io.emit(SOCKET_TEST, message);
    return message;
  }

  @handle(GET_PAGE_TITLE)
  async getPageTitle({ url }: { url: string }) {
    const fallbackTitle = randomName();
    const title = await getPageTitle(url, fallbackTitle);
    return { data: title };
  }

  @handle(GET_FAVORITES)
  async getFavorites() {
    return this.favoriteService.getFavorites();
  }

  @handle(ADD_FAVORITE)
  async addFavorite(favorite: Favorite) {
    return this.favoriteService.addFavorite(favorite);
  }

  @handle(REMOVE_FAVORITE)
  async removeFavorite({ id }: { id: number }) {
    return this.favoriteService.removeFavorite(id);
  }

  @handle(EXPORT_FAVORITES)
  async exportFavorites() {
    return this.favoriteService.exportFavorites();
  }

  @handle(IMPORT_FAVORITES)
  async importFavorites(favorites: any[]) {
    await this.favoriteService.importFavorites(favorites);
  }
}
