import { provide } from "@inversifyjs/binding-decorators";
import type { Controller } from "@mediago/shared-common";
import { type Favorite, FavoriteManagementService, handle, TYPES } from "@mediago/shared-node";
import axios from "axios";
import { inject, injectable } from "inversify";
import Logger from "../vendor/Logger";
import SocketIO from "../vendor/SocketIO";
import StoreService from "../vendor/Store";

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
  ) {}

  @handle("get-app-store")
  async getAppStore() {
    const store = await this.store.store;
    return store;
  }

  @handle("set-app-store")
  async setAppStore(params: { key: string; val: any }) {
    this.store.set(params.key, params.val);
    this.logger.info("set app store");
    return false;
  }

  @handle("socket-test")
  async socketTest({ message }: { message: string }) {
    this.logger.info(message);

    this.socket.io.emit("socket-test", message);
    return message;
  }

  @handle("get-page-title")
  async getPageTitle({ url }: { url: string }) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const html = response.data;
      let title = "无标题";

      const patterns = [
        /<meta\s+property="og:title"\s+content="([^"]*)"/i,
        /<meta\s+name="title"\s+content="([^"]*)"/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          title = match[1].trim();
          console.log("Found title:", title);
          break;
        }
      }

      return { data: title };
    } catch (error) {
      console.error("Error fetching page title:", error);
      return { data: "无标题" };
    }
  }

  @handle("get-favorites")
  async getFavorites() {
    return this.favoriteService.getFavorites();
  }

  @handle("add-favorite")
  async addFavorite(favorite: Favorite) {
    return this.favoriteService.addFavorite(favorite);
  }

  @handle("remove-favorite")
  async removeFavorite({ id }: { id: number }) {
    return this.favoriteService.removeFavorite(id);
  }

  @handle("export-favorites")
  async exportFavorites() {
    return this.favoriteService.exportFavorites();
  }

  @handle("import-favorites")
  async importFavorites(favorites: any[]) {
    await this.favoriteService.importFavorites(favorites);
  }
}
