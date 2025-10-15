import type http from "node:http";
import { provide } from "@inversifyjs/binding-decorators";
import type { DownloadProgress } from "@mediago/shared-common";
import { DownloadTaskService } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import _ from "lodash";
import { Server } from "socket.io";
import type { Vendor } from "../core/vendor";
import Logger from "./Logger";
import StoreService from "./Store";

@injectable()
@provide()
export default class SocketIO implements Vendor {
  io: Server;

  constructor(
    @inject(DownloadTaskService)
    private readonly downloadTaskService: DownloadTaskService,
    @inject(Logger)
    private readonly logger: Logger,
    @inject(StoreService)
    private readonly store: StoreService,
  ) {}

  async init() {}

  async initSocketIO(server: http.Server) {
    this.io = new Server(server, {
      /* options */
      cors: {
        origin: "*",
      },
    });

    // this.taskQueueService.on("download-ready-start", this.onDownloadReadyStart);
    // this.taskQueueService.on("download-progress", this.onDownloadProgress);
    // this.taskQueueService.on("download-success", this.onDownloadSuccess);
    // this.taskQueueService.on("download-failed", this.onDownloadFailed);
    // this.taskQueueService.on("download-start", this.onDownloadStart);
    // this.taskQueueService.on("download-stop", this.onDownloadStop);
    // this.taskQueueService.on("download-message", this.receiveMessage);
  }

  onDownloadReadyStart = async ({ id, isLive }: DownloadProgress) => {
    if (isLive) {
      await this.downloadTaskService.updateIsLive(id, true);
    }
  };

  onDownloadProgress = (progress: DownloadProgress) => {
    this.logger.info(`download task: ${progress.id}`, JSON.stringify(progress));
  };

  onDownloadSuccess = async (id: number) => {
    this.logger.info(`download task: ${id} success`);
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

  receiveMessage = async (id: number, message: string) => {
    await this.downloadTaskService.appendLog(id, message);
  };

  refreshList = async () => {
    // 页面刷新
  };
}
