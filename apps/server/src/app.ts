import http from "node:http";
import { provide } from "@inversifyjs/binding-decorators";
import cors from "@koa/cors";
import { DownloaderServer, VideoServer } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import send from "koa-send";
import serve from "koa-static";
import RouterHandlerService from "./core/router";
import { DB_PATH, LOG_DIR, STATIC_DIR } from "./constants";
import ServerConfigCache from "./services/server-config-cache";
import Logger from "./vendor/Logger";
import SocketIO from "./vendor/SocketIO";
import "./controller";
import AuthMiddleware from "./middleware/auth";
import path from "node:path";
import fs from "node:fs/promises";

@injectable()
@provide()
export default class ElectronApp extends Koa {
  constructor(
    @inject(RouterHandlerService)
    private readonly router: RouterHandlerService,
    @inject(Logger)
    private readonly logger: Logger,
    @inject(SocketIO)
    private readonly socket: SocketIO,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
    @inject(VideoServer)
    private readonly videoServer: VideoServer,
    @inject(AuthMiddleware)
    private readonly authMiddleware: AuthMiddleware,
    @inject(ServerConfigCache)
    private readonly configCache: ServerConfigCache,
  ) {
    super();
  }

  async init(): Promise<void> {
    this.router.init();

    this.use(cors());

    this.use(bodyParser());
    this.use(this.authMiddleware.handle.bind(this.authMiddleware));
    this.use(this.router.routes());
    this.use(this.router.allowedMethods());

    if (process.env.NODE_ENV === "production") {
      this.use(serve(STATIC_DIR));

      // Middleware that handles static files and front-end routing
      this.use(async (ctx) => {
        const filePath = path.join(STATIC_DIR, ctx.path);
        try {
          await fs.access(filePath);
          await send(ctx, filePath, { root: STATIC_DIR });
        } catch {
          await send(ctx, "index.html", { root: STATIC_DIR });
        }
      });
    }

    const server = http.createServer(this.callback());

    this.socket.initSocketIO(server);

    // Start Go download service first (reads config from its own conf file)
    await this.downloaderServer.start({
      logDir: LOG_DIR,
      dbPath: DB_PATH,
    });

    // Read config from Go (single source of truth) and seed cache
    const client = this.downloaderServer.getClient();
    const { data: config } = await client.getConfig();
    this.configCache.seed(config as any);

    this.videoServer.start({ local: config.local, enableMobilePlayer: true });

    // Listen for Go config changes → update cache
    this.downloaderServer.on(
      "config-changed",
      (key: string, value: unknown) => {
        this.configCache.update(key, value);
      },
    );

    server.listen(8899, () => {
      this.logger.info("Server running on port 8899");
    });
  }
}
