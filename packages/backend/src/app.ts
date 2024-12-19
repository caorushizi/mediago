import { inject, injectable } from "inversify";
import { TYPES } from "./types.ts";
import TypeORM from "./vendor/TypeORM.ts";
import RouterHandlerService from "./core/router.ts";
import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import Logger from "./vendor/Logger.ts";
import http from "http";
import SocketIO from "./vendor/SocketIO.ts";
import VideoRepository from "./repository/VideoRepository.ts";
import { DownloadStatus } from "./interfaces.ts";
import serve from "koa-static";
import { STATIC_DIR } from "./const.ts";
import send from "koa-send";

@injectable()
export default class ElectronApp extends Koa {
  constructor(
    @inject(TYPES.RouterHandlerService)
    private readonly router: RouterHandlerService,
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.SocketIO)
    private readonly socket: SocketIO,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
  ) {
    super();
  }

  private async vendorInit() {
    await this.db.init();
  }

  async init(): Promise<void> {
    this.router.init();

    // vendor
    await this.vendorInit();

    this.use(cors())
      .use(bodyParser())
      .use(this.router.routes())
      .use(this.router.allowedMethods());
    this.use(serve(STATIC_DIR));

    // Middleware that handles static files and front-end routing
    this.use(async (ctx, next) => {
      if (!ctx.path.startsWith("/api")) {
        try {
          await send(ctx, ctx.path, { root: STATIC_DIR });
        } catch (err: any) {
          if (err.status === 404) {
            await send(ctx, "index.html", { root: STATIC_DIR });
          }
        }
      }
      await next();
    });

    const server = http.createServer(this.callback());

    this.socket.initSocketIO(server);

    server.listen(8899, () => {
      this.logger.info("Server running on port 8899");
    });
  }

  // If there are still videos being downloaded after the restart, change the status to download failed
  async resetDownloadStatus(): Promise<void> {
    // If data in the downloading state still fails after the restart, all downloads fail
    const videos = await this.videoRepository.findWattingAndDownloadingVideos();
    const videoIds = videos.map((video) => video.id);
    await this.videoRepository.changeVideoStatus(
      videoIds,
      DownloadStatus.Failed,
    );
  }
}
