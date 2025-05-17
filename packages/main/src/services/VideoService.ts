import { inject, injectable } from "inversify";
import serveHandler from "serve-handler";
import { glob } from "glob";
import { TYPES } from "@mediago/shared/node";
import StoreService from "../vendor/ElectronStore.ts";
import mime from "mime-types";
import path from "path";
import express from "express";
import ElectronLogger from "../vendor/ElectronLogger.ts";
import cors from "cors";
import { mobileDir } from "../helper/variables.ts";
import { getLocalIP } from "../helper/index.ts";

@injectable()
export class VideoService {
  private port = 3222;
  private videoDir: string;
  private localIp: string;

  constructor(
    @inject(TYPES.ElectronStore)
    private readonly store: StoreService,
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger
  ) {
    this.videoDir = this.store.get("local");
    this.localIp = getLocalIP();
  }

  // Use glob to search video files
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
          url: `http://${this.localIp}:${this.port}/${encodeURIComponent(
            fileName
          )}`,
        };
      });
    return videos;
  };

  init() {
    const app = express();

    app.use(cors());

    app.get("/", (req, res) => {
      res.sendFile(path.join(mobileDir, "index.html"));
    });

    app.get("/api", async (req, res) => {
      const videos = await this.getVideoFiles();
      res.json(videos);
    });

    app.use(express.static(mobileDir));

    // Middleware that uses serve-handler to handle static file requests
    app.use(async (req, res) => {
      return serveHandler(req, res, {
        public: this.videoDir,
      });
    });

    // Start the server directly using Koa's listen method
    app
      .listen(this.port, "0.0.0.0", () => {
        this.logger.info("Server is running on http://localhost:3222");
      })
      .on("error", (err) => {
        this.logger.error(
          `Server failed to start on http://localhost:3222, error: ${err}`
        );
      });
  }
}
