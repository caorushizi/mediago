import { provide } from "@inversifyjs/binding-decorators";
import {
  type Controller,
  DownloadItem,
  DownloadItemPagination,
  ADD_DOWNLOAD_ITEMS,
  DELETE_DOWNLOAD_ITEM,
  EDIT_DOWNLOAD_ITEM,
  GET_DOWNLOAD_ITEMS,
  GET_VIDEO_FOLDERS,
  START_DOWNLOAD,
  STOP_DOWNLOAD,
} from "@mediago/shared-common";
import { type DownloadManagementService, handle, TYPES } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import Logger from "../vendor/Logger";
import SocketIO from "../vendor/SocketIO";
import StoreService from "../vendor/Store";

@injectable()
@provide(TYPES.Controller)
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.DownloadManagementService)
    private readonly downloadService: DownloadManagementService,
    @inject(Logger)
    private readonly logger: Logger,
    @inject(SocketIO)
    private readonly socket: SocketIO,
    @inject(StoreService)
    private readonly store: StoreService,
  ) {}

  @handle(ADD_DOWNLOAD_ITEMS)
  async addDownloadItems({ videos, startDownload }: { videos: Omit<DownloadItem, "id">[]; startDownload?: boolean }) {
    const items = await this.downloadService.addDownloadItems(videos);

    this.socket.refreshList();

    // Start downloading immediately if requested
    if (startDownload) {
      const local = await this.store.get("local");
      const deleteSegments = await this.store.get("deleteSegments");
      items.forEach((item: any) => {
        this.downloadService.startDownload(item.id, local, deleteSegments);
      });
    }

    return items;
  }

  @handle(GET_DOWNLOAD_ITEMS)
  async getDownloadItems(pagination: DownloadItemPagination) {
    const local = await this.store.get("local");
    return await this.downloadService.getDownloadItems(pagination, local, "mp4,mkv,avi,mov,wmv,flv,webm,m4v");
  }

  @handle(START_DOWNLOAD)
  async startDownload({ vid }: { vid: number }) {
    const local = await this.store.get("local");
    const deleteSegments = await this.store.get("deleteSegments");
    await this.downloadService.startDownload(vid, local, deleteSegments);
  }

  @handle(DELETE_DOWNLOAD_ITEM)
  async deleteDownloadItem({ id }: { id: number }) {
    await this.downloadService.deleteDownloadItem(id);
  }

  @handle(EDIT_DOWNLOAD_ITEM)
  async editDownloadItem({ video, startDownload }: { video: DownloadItem; startDownload?: boolean }) {
    this.logger.info("editDownloadItem", video);
    const item = await this.downloadService.editDownloadItem(video);

    // Start downloading immediately if requested
    if (startDownload) {
      const local = await this.store.get("local");
      const deleteSegments = await this.store.get("deleteSegments");
      await this.downloadService.startDownload(item.id, local, deleteSegments);
    }

    return item;
  }

  @handle(STOP_DOWNLOAD)
  async stopDownload({ id }: { id: number }) {
    this.downloadService.stopDownload(id);
  }

  @handle(GET_VIDEO_FOLDERS)
  async getVideoFolders() {
    return this.downloadService.getVideoFolders();
  }
}
