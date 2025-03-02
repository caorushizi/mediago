import { inject, injectable } from "inversify";
import { Vendor } from "../core/vendor.ts";
import http from "http";
import { Server } from "socket.io";
import { TYPES } from "../types.ts";
import DownloadService from "../services/DownloadService.ts";
import { DownloadProgress } from "../interfaces.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import Logger from "./Logger.ts";
import ConfigService from "../services/ConfigService.ts";

@injectable()
export default class SocketIO implements Vendor {
  io: Server;

  constructor(
    @inject(TYPES.DownloadService)
    private readonly downloadService: DownloadService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.ConfigService)
    private readonly store: ConfigService
  ) {}

  async init() {}

  async initSocketIO(server: http.Server) {
    this.io = new Server(server, {
      /* options */
      cors: {
        origin: "*",
      },
    });

    this.io.engine.on("headers", (headers) => {
      headers["Access-Control-Allow-Private-Network"] = true;
    });

    this.io.on("connection", () => {});

    this.downloadService.on("download-ready-start", this.onDownloadReadyStart);
    this.downloadService.on("download-progress", this.onDownloadProgress);
    this.downloadService.on("download-success", this.onDownloadSuccess);
    this.downloadService.on("download-failed", this.onDownloadFailed);
    this.downloadService.on("download-start", this.onDownloadStart);
    this.downloadService.on("download-stop", this.onDownloadStop);
    this.downloadService.on("download-message", this.receiveMessage);
  }

  async emit(event: string, ...data: any[]) {
    this.io.emit(event, {}, ...data);
  }

  onDownloadReadyStart = async ({ id, isLive }: DownloadProgress) => {
    if (isLive) {
      await this.videoRepository.changeVideoIsLive(id);
      this.emit("change-video-is-live", { id });
    }
  };

  onDownloadProgress = (progress: DownloadProgress) => {
    this.emit("download-progress", progress);
  };

  onDownloadSuccess = async (id: number) => {
    this.emit("download-success", id);
  };

  onDownloadFailed = async (id: number, err: unknown) => {
    this.logger.error("download failed: ", err);
    this.emit("download-failed", id);
  };

  onDownloadStart = async (id: number) => {
    this.emit("download-start", id);
  };

  onDownloadStop = async (id: number) => {
    this.emit("download-stop", id);
  };

  receiveMessage = async (id: number, message: string) => {
    // Write the log to the database
    await this.videoRepository.appendDownloadLog(id, message);
  };

  refreshList = async () => {
    this.emit("refresh-list");
  };
}
