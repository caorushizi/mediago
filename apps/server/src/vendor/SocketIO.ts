import type http from "node:http";
import { provide } from "@inversifyjs/binding-decorators";
import {
  DOWNLOAD_EVENT_NAME,
  DownloadStatus,
  DownloadSuccessEvent,
  DownloadTask,
  type DownloadProgress,
  type DownloadProgressEvent,
} from "@mediago/shared-common";
import { DownloaderServer, DownloadTaskService } from "@mediago/shared-node";
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

    // this.taskQueueService.on("download-ready-start", this.onDownloadReadyStart);
    this.downloaderServer.on("download-progress", this.onDownloadProgress);
    this.downloaderServer.on("download-success", this.onDownloadSuccess);
    this.downloaderServer.on("download-failed", this.onDownloadFailed);
    this.downloaderServer.on("download-start", this.onDownloadStart);
    this.downloaderServer.on("download-stop", this.onDownloadStop);
    // this.taskQueueService.on("download-message", this.receiveMessage);
  }

  onDownloadReadyStart = async ({ id, isLive }: DownloadProgress) => {
    if (isLive) {
      await this.downloadTaskService.setIsLive(id, true);
    }
  };

  onDownloadProgress = (tasks: DownloadProgress[]) => {
    const data: DownloadProgressEvent = {
      type: "progress",
      data: tasks,
    };
    this.io.emit(DOWNLOAD_EVENT_NAME, data);
  };

  onDownloadSuccess = async (id: number) => {
    this.logger.info(`download task: ${id} success`);
    const video = await this.downloadTaskService.findByIdOrFail(id);

    const data: DownloadSuccessEvent = {
      type: "success",
      // FIXME: Type 'Video' is not assignable to type 'DownloadTask'.
      data: video as unknown as DownloadTask,
    };
    this.io.emit(DOWNLOAD_EVENT_NAME, data);
  };

  onDownloadFailed = async (id: number, err: unknown) => {
    this.logger.error(`download task: ${id} failed: ${err}`);

    await this.downloadTaskService.setStatus(id, DownloadStatus.Failed);
  };

  onDownloadStart = async (id: number) => {
    this.logger.info(`download task: ${id} start`);

    await this.downloadTaskService.setStatus(id, DownloadStatus.Downloading);
  };

  onDownloadStop = async (id: number) => {
    this.logger.info(`download task: ${id} stop`);
    await this.downloadTaskService.setStatus(id, DownloadStatus.Stopped);
  };

  receiveMessage = async (id: number, message: string) => {
    await this.downloadTaskService.appendLog(id, message);
  };

  refreshList = async () => {
    // 页面刷新
  };
}
