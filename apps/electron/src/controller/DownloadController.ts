import { provide } from "@inversifyjs/binding-decorators";
import {
  ADD_DOWNLOAD_ITEMS,
  type Controller,
  DELETE_DOWNLOAD_ITEM,
  type DownloadItem,
  type DownloadItemPagination,
  EDIT_DOWNLOAD_ITEM,
  GET_DOWNLOAD_ITEMS,
  type ListPagination,
  SHOW_DOWNLOAD_DIALOG,
  START_DOWNLOAD,
  STOP_DOWNLOAD,
} from "@mediago/shared-common";
import { type DownloadManagementService, handle, TYPES } from "@mediago/shared-node";
import type { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";
import { videoPattern } from "../helper/index";
import WebviewService from "../services/WebviewService";
import ElectronStore from "../vendor/ElectronStore";
import MainWindow from "../windows/MainWindow";

@injectable()
@provide(TYPES.Controller)
export default class DownloadController implements Controller {
  constructor(
    @inject(ElectronStore)
    private readonly store: ElectronStore,
    @inject(TYPES.DownloadManagementService)
    private readonly downloadService: DownloadManagementService,
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(WebviewService)
    private readonly webviewService: WebviewService,
  ) {}

  @handle(SHOW_DOWNLOAD_DIALOG)
  async showDownloadDialog(_e: IpcMainEvent, data: DownloadItem) {
    const image = await this.webviewService.captureView();
    this.webviewService.sendToWindow(SHOW_DOWNLOAD_DIALOG, data, image?.toDataURL());
  }

  @handle(ADD_DOWNLOAD_ITEMS)
  async addDownloadItems(_e: IpcMainEvent, videos: Omit<DownloadItem, "id">[], startDownload?: boolean) {
    const items = await this.downloadService.addDownloadItems(videos);
    // This sends a message to the page notifying it of the update
    this.mainWindow.send("download-item-notifier", items);

    // Start downloading immediately if requested
    if (startDownload) {
      const local = this.store.get("local");
      const deleteSegments = this.store.get("deleteSegments");
      items.forEach((item) => {
        this.downloadService.startDownload(item.id, local, deleteSegments);
      });
    }

    return items;
  }

  @handle(EDIT_DOWNLOAD_ITEM)
  async editDownloadItem(_e: IpcMainEvent, video: DownloadItem, startDownload?: boolean) {
    const item = await this.downloadService.editDownloadItem(video);

    // Start downloading immediately if requested
    if (startDownload) {
      const local = this.store.get("local");
      const deleteSegments = this.store.get("deleteSegments");
      await this.downloadService.startDownload(item.id, local, deleteSegments);
    }

    return item;
  }

  @handle(GET_DOWNLOAD_ITEMS)
  async getDownloadItems(_e: IpcMainEvent, pagination: DownloadItemPagination): Promise<ListPagination> {
    const local = this.store.get("local");
    return await this.downloadService.getDownloadItems(pagination, local, videoPattern);
  }

  @handle(START_DOWNLOAD)
  async startDownload(_e: IpcMainEvent, vid: number) {
    const local = this.store.get("local");
    const deleteSegments = this.store.get("deleteSegments");
    await this.downloadService.startDownload(vid, local, deleteSegments);
  }

  @handle(STOP_DOWNLOAD)
  async stopDownload(_e: IpcMainEvent, id: number) {
    this.downloadService.stopDownload(id);
  }

  @handle(DELETE_DOWNLOAD_ITEM)
  async deleteDownloadItem(_e: IpcMainEvent, id: number) {
    return await this.downloadService.deleteDownloadItem(id);
  }
}
