import http from "node:http";
import { provide } from "@inversifyjs/binding-decorators";
import cors from "@koa/cors";
import { DownloadStatus } from "@mediago/shared-common";
import { DownloaderService, TaskQueueService, TypeORM, VideoRepository } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import send from "koa-send";
import serve from "koa-static";
import RouterHandlerService from "./core/router";
import { ptyRunner } from "./helper/ptyRunner";
import { binMap, DB_PATH, STATIC_DIR } from "./helper/variables";
import Logger from "./vendor/Logger";
import SocketIO from "./vendor/SocketIO";
import StoreService from "./vendor/Store";
import "./controller";

@injectable()
@provide()
export default class ElectronApp extends Koa {
  constructor(
    @inject(RouterHandlerService)
    private readonly router: RouterHandlerService,
    @inject(TypeORM)
    private readonly db: TypeORM,
    @inject(Logger)
    private readonly logger: Logger,
    @inject(SocketIO)
    private readonly socket: SocketIO,
    @inject(VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(DownloaderService)
    private readonly downloaderService: DownloaderService,
    @inject(TaskQueueService)
    private readonly taskQueueService: TaskQueueService,
    @inject(StoreService)
    private readonly store: StoreService,
  ) {
    super();
  }

  private async vendorInit() {
    await this.db.init({ dbPath: DB_PATH });
  }

  async init(): Promise<void> {
    this.router.init();

    // vendor
    await this.vendorInit();

    this.use(cors()).use(bodyParser()).use(this.router.routes()).use(this.router.allowedMethods());
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

    this.taskQueueService.init({
      maxRunner: this.store.get("maxRunner"),
      proxy: this.store.get("proxy"),
    });

    this.store.onDidChange("maxRunner", (maxRunner) => {
      this.taskQueueService.changeMaxRunner(maxRunner || 1);
    });
    this.store.onDidChange("proxy", (proxy) => {
      this.taskQueueService.changeProxy(proxy || "");
    });

    this.downloaderService.init(binMap, ptyRunner);

    server.listen(8899, () => {
      this.logger.info("Server running on port 8899");
    });
  }

  // If there are still videos being downloaded after the restart, change the status to download failed
  async resetDownloadStatus(): Promise<void> {
    // If data in the downloading state still fails after the restart, all downloads fail
    const videos = await this.videoRepository.findWattingAndDownloadingVideos();
    const videoIds = videos.map((video) => video.id);
    await this.videoRepository.changeVideoStatus(videoIds, DownloadStatus.Failed);
  }
}
