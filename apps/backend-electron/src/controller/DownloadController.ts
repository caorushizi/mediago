import { provide } from "@inversifyjs/binding-decorators";
import {
  type Controller,
  type DownloadItem,
  type DownloadItemPagination,
  type ListPagination,
} from "@mediago/shared-common";
import { DownloadManagementService, handle, TYPES } from "@mediago/shared-node";
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

  @handle("show-download-dialog")
  async showDownloadDialog(e: IpcMainEvent, data: DownloadItem) {
    const image = await this.webviewService.captureView();
    this.webviewService.sendToWindow("show-download-dialog", data, image?.toDataURL());
  }


  @handle("add-download-items")
  async addDownloadItems(e: IpcMainEvent, videos: Omit<DownloadItem, "id">[], startDownload?: boolean) {
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

  @handle("edit-download-item")
  async editDownloadItem(e: IpcMainEvent, video: DownloadItem, startDownload?: boolean) {
    const item = await this.downloadService.editDownloadItem(video);
    
    // Start downloading immediately if requested
    if (startDownload) {
      const local = this.store.get("local");
      const deleteSegments = this.store.get("deleteSegments");
      await this.downloadService.startDownload(item.id, local, deleteSegments);
    }
    
    return item;
  }



  @handle("get-download-items")
  async getDownloadItems(e: IpcMainEvent, pagination: DownloadItemPagination): Promise<ListPagination> {
    const local = this.store.get("local");
    return await this.downloadService.getDownloadItems(pagination, local, videoPattern);
  }

  @handle("start-download")
  async startDownload(e: IpcMainEvent, vid: number) {
    const local = this.store.get("local");
    const deleteSegments = this.store.get("deleteSegments");
    await this.downloadService.startDownload(vid, local, deleteSegments);
  }

  @handle("stop-download")
  async stopDownload(e: IpcMainEvent, id: number) {
    this.downloadService.stopDownload(id);
  }

  @handle("delete-download-item")
  async deleteDownloadItem(e: IpcMainEvent, id: number) {
    return await this.downloadService.deleteDownloadItem(id);
  }
}
