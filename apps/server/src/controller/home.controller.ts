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
  DownloaderServer,
  getPageTitle,
  handle,
  randomName,
  TYPES,
  VideoServer,
} from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import Logger from "../vendor/Logger";
import SocketIO from "../vendor/SocketIO";
import { BIN_DIR, DB_PATH, WORKSPACE } from "../utils";

@injectable()
@provide(TYPES.Controller)
export default class HomeController implements Controller {
  constructor(
    @inject(Logger)
    private readonly logger: Logger,
    @inject(SocketIO)
    private readonly socket: SocketIO,
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
      binPath: BIN_DIR,
      dbPath: DB_PATH,
      workspace: WORKSPACE,
      platform: process.platform,
      local: config.local,
      playerUrl: this.videoServer.getURL() ?? "",
      coreUrl: (await this.downloaderServer.getURL()) ?? "",
    };
  }

  @handle(GET_APP_STORE)
  async getAppStore() {
    const client = this.downloaderServer.getClient();
    const res = await client.getConfig();
    return res.data;
  }

  @handle(SET_APP_STORE)
  async setAppStore(params: { key: string; val: any }) {
    const client = this.downloaderServer.getClient();
    await client.setConfigKey(params.key, params.val);
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
    const client = this.downloaderServer.getClient();
    const res = await client.getFavorites();
    return res.data;
  }

  @handle(ADD_FAVORITE)
  async addFavorite(favorite: { title: string; url: string; icon?: string }) {
    const client = this.downloaderServer.getClient();
    const res = await client.addFavorite(favorite);
    return res.data;
  }

  @handle(REMOVE_FAVORITE)
  async removeFavorite(params: { id: number }) {
    const client = this.downloaderServer.getClient();
    await client.removeFavorite(params.id);
  }

  @handle(EXPORT_FAVORITES)
  async exportFavorites() {
    const client = this.downloaderServer.getClient();
    const res = await client.exportFavorites();
    return res.data;
  }

  @handle(IMPORT_FAVORITES)
  async importFavorites(
    favorites: { title: string; url: string; icon?: string }[],
  ) {
    const client = this.downloaderServer.getClient();
    await client.importFavorites(favorites);
  }
}
