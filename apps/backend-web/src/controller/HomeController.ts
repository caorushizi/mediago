import { provide } from "@inversifyjs/binding-decorators";
import type { Controller } from "@mediago/shared/common";
import { FavoriteRepository, TYPES } from "@mediago/shared/node";
import axios from "axios";
import { inject, injectable } from "inversify";
import type { Context } from "koa";
import { handle } from "../helper/index";
import Logger from "../vendor/Logger";
import SocketIO from "../vendor/SocketIO";
import StoreService from "../vendor/Store";

@injectable()
@provide(TYPES.Controller)
export default class HomeController implements Controller {
  constructor(
    @inject(FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
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
  async setAppStore(ctx: Context) {
    const params = ctx.request.body as { key: string; val: any };
    this.store.set(params.key, params.val);
    this.logger.info("set app store");
    return false;
  }

  @handle("socket-test")
  async socketTest(ctx: Context) {
    const { message } = ctx.request.body as { message: string };
    this.logger.info(message);

    this.socket.io.emit("socket-test", message);
    return message;
  }

  @handle("get-page-title")
  async getPageTitle(ctx: Context) {
    try {
      const { url } = ctx.request.body as { url: string };

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
}
