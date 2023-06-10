import { StoreService, WebService } from "../interfaces";
import { inject, injectable } from "inversify";
import Koa, { Context } from "koa";
import Router from "@koa/router";
import serve from "koa-static";
import range from "koa-range";
import { TYPES } from "types";
import { glob } from "glob";
import send from "koa-send";
import cors from "@koa/cors";

@injectable()
export default class WebServiceImpl implements WebService {
  private readonly app: Koa;
  private readonly router: Router;

  constructor(
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService
  ) {
    this.app = new Koa();
    this.router = new Router();
  }

  async init(): Promise<void> {
    this.router.get("/", this.home);
    this.router.get("/api/video-list", this.videoList);
    this.router.get("/video/:filename", this.serveVideo);
    const local = this.storeService.get("local");

    this.app.use(cors());
    this.app.use(range);
    this.app.use(serve(local));
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    this.app.listen(3000);
  }

  private home = (ctx: Context) => {
    ctx.body = {
      test: 1,
    };
  };

  private videoList = async (ctx: Context) => {
    const local = this.storeService.get("local");
    const mp4Files = await glob("*.mp4", {
      cwd: local,
    });
    const baseUrl = "http://localhost:3000/video/";

    ctx.body = mp4Files.map((file) => ({
      name: file,
      url: `${baseUrl}${file}`,
    }));
  };

  private serveVideo = async (ctx: Context) => {
    const { filename } = ctx.params;
    const local = this.storeService.get("local");
    const file = filename;
    await send(ctx, file, { root: local, index: false });
  };
}
