import {
  LoggerService,
  StoreService,
  VideoRepository,
  WebService,
} from "../interfaces";
import { inject, injectable } from "inversify";
import Koa, { Context } from "koa";
import Router from "@koa/router";
import serve from "koa-static";
import range from "koa-range";
import { TYPES } from "types";
import { glob } from "glob";
import send from "koa-send";
import cors from "@koa/cors";
import { getLocalIP, mobilePath } from "helper";

@injectable()
export default class WebServiceImpl implements WebService {
  private readonly app: Koa;
  private readonly router: Router;
  private readonly baseUrl: string;

  constructor(
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService
  ) {
    this.app = new Koa();
    this.router = new Router();
    this.baseUrl = `http://${getLocalIP()}:${
      process.env.APP_SERVER_PORT
    }/video/`;
  }

  async init(): Promise<void> {
    this.router.get("/api/video-list", this.videoList);
    this.router.get("/video/:filename", this.serveVideo);
    const local = this.storeService.get("local");

    this.app.use(cors());
    this.app.use(range);
    this.app.use(serve(local));
    this.app.use(
      serve(mobilePath, {
        extensions: ["html", "js", "css"],
        index: "index.html",
      })
    );
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    this.app
      .listen(process.env.APP_SERVER_PORT, () => {
        this.logger.info("web server init success.");
      })
      .on("error", (err: unknown) => {
        this.logger.error("server error", err);
      });
  }

  private videoList = async (ctx: Context) => {
    const local = this.storeService.get("local");
    const mp4Files = await glob("*.mp4", {
      cwd: local,
    });
    const videoList = await this.videoRepository.findAllVideos();

    const res = mp4Files
      .map((file) => {
        const name = file.split(".").shift();

        const video = videoList.find((video) => video.name === name);
        if (!video) return null;

        return {
          id: video.id,
          name: video.name,
          url: `${this.baseUrl}${file}`,
        };
      })
      .filter(Boolean);
    ctx.body = res;
  };

  private serveVideo = async (ctx: Context) => {
    const { filename } = ctx.params;
    const local = this.storeService.get("local");
    const file = filename;
    await send(ctx, file, { root: local, index: false });
  };
}
