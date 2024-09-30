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

    const server = http.createServer(this.callback());

    this.socket.initSocketIO(server);

    server.listen(3000, () => {
      this.logger.info("Server running on port 3000");
    });
  }

  // 如果重启后还有正在下载的视频，就将状态改成下载失败
  async resetDownloadStatus(): Promise<void> {
    // 重启后如果还有 downloading 状态的数据， 全部重置为失败
    const videos = await this.videoRepository.findWattingAndDownloadingVideos();
    const videoIds = videos.map((video) => video.id);
    await this.videoRepository.changeVideoStatus(
      videoIds,
      DownloadStatus.Failed,
    );
  }
}
