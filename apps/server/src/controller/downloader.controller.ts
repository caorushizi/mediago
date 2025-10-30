import { provide } from "@inversifyjs/binding-decorators";
import {
  ADD_DOWNLOAD_ITEMS,
  type Controller,
  DELETE_DOWNLOAD_ITEM,
  type DownloadTask,
  type DownloadTaskPagination,
  EDIT_DOWNLOAD_ITEM,
  GET_DOWNLOAD_ITEMS,
  GET_VIDEO_FOLDERS,
  START_DOWNLOAD,
  STOP_DOWNLOAD,
} from "@mediago/shared-common";
import { DownloadTaskService, handle, TYPES } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import Logger from "../vendor/Logger";
import SocketIO from "../vendor/SocketIO";
import StoreService from "../vendor/Store";

@injectable()
@provide(TYPES.Controller)
export default class DownloadController implements Controller {
  constructor(
    @inject(DownloadTaskService)
    private readonly downloadService: DownloadTaskService,
    @inject(Logger)
    private readonly logger: Logger,
    @inject(SocketIO)
    private readonly socket: SocketIO,
    @inject(StoreService)
    private readonly store: StoreService,
  ) {}

  @handle(ADD_DOWNLOAD_ITEMS)
  async createDownloadTasks({
    videos,
    startDownload,
  }: {
    videos: Omit<DownloadTask, "id">[];
    startDownload?: boolean;
  }) {
    const items = await this.downloadService.createMany(videos);

    this.socket.refreshList();

    // Start downloading immediately if requested
    if (startDownload) {
      const local = await this.store.get("local");
      const deleteSegments = await this.store.get("deleteSegments");
      items.forEach((item: any) => {
        this.downloadService.start(item.id, local, deleteSegments);
      });
    }

    return items;
  }

  @handle(GET_DOWNLOAD_ITEMS)
  async getDownloadTasks(pagination: DownloadTaskPagination) {
    const local = await this.store.get("local");
    return await this.downloadService.list(pagination, local);
  }

  @handle(START_DOWNLOAD)
  async startDownloadTask({ vid }: { vid: number }) {
    const local = await this.store.get("local");
    const deleteSegments = await this.store.get("deleteSegments");
    await this.downloadService.start(vid, local, deleteSegments);
  }

  @handle(DELETE_DOWNLOAD_ITEM)
  async deleteDownloadTask({ id }: { id: number }) {
    await this.downloadService.remove(id);
  }

  @handle(EDIT_DOWNLOAD_ITEM)
  async updateDownloadTask({ video, startDownload }: { video: DownloadTask; startDownload?: boolean }) {
    this.logger.info("editDownloadTask", video);
    const item = await this.downloadService.update(video);

    // Start downloading immediately if requested
    if (startDownload) {
      const local = await this.store.get("local");
      const deleteSegments = await this.store.get("deleteSegments");
      await this.downloadService.start(item.id, local, deleteSegments);
    }

    return item;
  }

  @handle(STOP_DOWNLOAD)
  async stopDownloadTask({ id }: { id: number }) {
    this.downloadService.stop(id);
  }

  @handle(GET_VIDEO_FOLDERS)
  async getVideoFolders() {
    return this.downloadService.listFolders();
  }
}
