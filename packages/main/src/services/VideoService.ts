import { inject, injectable } from "inversify";
import serveHandler from "serve-handler";
import { glob } from "glob";
import { TYPES } from "../types.ts";
import StoreService from "../vendor/ElectronStore.ts";
import mime from "mime-types";
import path from "path";
import express from "express";
import ElectronLogger from "../vendor/ElectronLogger.ts";
import cors from "cors";

@injectable()
export class VideoService {
  private port = 3222;
  private videoDir: string;
  constructor(
    @inject(TYPES.ElectronStore)
    private readonly store: StoreService,
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {
    this.videoDir = this.store.get("local");
  }

  // 使用glob搜索视频文件
  getVideoFiles = async () => {
    const files = await glob(this.videoDir + "/*.*");
    const videos = files
      .filter((file) => {
        const mimeType = mime.lookup(file);
        return mimeType && mimeType.startsWith("video");
      })
      .map((file) => {
        const fileName = path.basename(file);
        return {
          title: fileName,
          url: `http://localhost:${this.port}/${encodeURIComponent(fileName)}`,
        };
      });
    return videos;
  };

  init() {
    const app = express();

    app.use(cors());

    app.get("/", async (req, res) => {
      const videos = await this.getVideoFiles();
      res.json(videos);
    });

    // 使用serve-handler处理静态文件请求的中间件
    app.use(async (req, res) => {
      return serveHandler(req, res, {
        public: this.videoDir,
      });
    });

    // 直接使用Koa的listen方法启动服务器
    app.listen(this.port, () => {
      this.logger.info("Server is running on http://localhost:3000");
    });
  }
}
