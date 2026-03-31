import type http from "node:http";
import { provide } from "@inversifyjs/binding-decorators";
import {
  DOWNLOAD_EVENT_NAME,
  type DownloadProgress,
  type DownloadProgressEvent,
} from "@mediago/shared-common";
import { DownloaderServer } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import { Server } from "socket.io";
import type { Vendor } from "../core/vendor";
import Logger from "./Logger";

@injectable()
@provide()
export default class SocketIO implements Vendor {
  io: Server;

  constructor(
    @inject(Logger)
    private readonly logger: Logger,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {}

  async init() {}

  async initSocketIO(server: http.Server) {
    this.io = new Server(server, {
      /* options */
      cors: {
        origin: "*",
      },
    });

    this.downloaderServer.on("download-progress", this.onDownloadProgress);
    this.downloaderServer.on("download-success", this.onDownloadSuccess);
    this.downloaderServer.on("download-failed", this.onDownloadFailed);
    this.downloaderServer.on("download-start", this.onDownloadStart);
    this.downloaderServer.on("download-stop", this.onDownloadStop);
  }

  onDownloadProgress = (tasks: DownloadProgress[]) => {
    const data: DownloadProgressEvent = {
      type: "progress",
      data: tasks,
    };
    this.io.emit(DOWNLOAD_EVENT_NAME, data);
  };

  // DB status updates are now handled by Go queue callbacks
  onDownloadSuccess = async (id: number) => {
    this.logger.info(`download task: ${id} success`);
    this.io.emit(DOWNLOAD_EVENT_NAME, {
      type: "success",
      data: { id },
    });
  };

  onDownloadFailed = async (id: number, err: unknown) => {
    this.logger.error(`download task: ${id} failed: ${err}`);
  };

  onDownloadStart = async (id: number) => {
    this.logger.info(`download task: ${id} start`);
  };

  onDownloadStop = async (id: number) => {
    this.logger.info(`download task: ${id} stop`);
  };
}
