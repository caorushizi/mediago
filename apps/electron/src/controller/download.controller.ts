import { provide } from "@inversifyjs/binding-decorators";
import {
  ADD_DOWNLOAD_ITEMS,
  type Controller,
  DELETE_DOWNLOAD_ITEM,
  type DownloadTask,
  type DownloadTaskPagination,
  EDIT_DOWNLOAD_ITEM,
  GET_DOWNLOAD_ITEMS,
  type ListPagination,
  SHOW_DOWNLOAD_DIALOG,
  START_DOWNLOAD,
  STOP_DOWNLOAD,
} from "@mediago/shared-common";
import { DownloadTaskService, handle, TYPES } from "@mediago/shared-node";
import type { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";
import { videoPattern } from "../helper/index";
import WebviewService from "../services/webview.service";
import ElectronStore from "../vendor/ElectronStore";
import MainWindow from "../windows/main.window";

@injectable()
@provide(TYPES.Controller)
export default class DownloadController implements Controller {
  constructor(
    @inject(ElectronStore)
    private readonly store: ElectronStore,
    @inject(DownloadTaskService)
    private readonly downloadTaskService: DownloadTaskService,
    @inject(MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(WebviewService)
    private readonly webviewService: WebviewService,
  ) {}

  @handle(SHOW_DOWNLOAD_DIALOG)
  async showDownloadDialog(e: IpcMainEvent, data: DownloadTask) {
    const image = await this.webviewService.captureView();
    this.webviewService.sendToWindow(SHOW_DOWNLOAD_DIALOG, data, image?.toDataURL());
  }

  @handle(ADD_DOWNLOAD_ITEMS)
  async createDownloadTasks(e: IpcMainEvent, tasks: Omit<DownloadTask, "id">[], startDownload?: boolean) {
    const items = await this.downloadTaskService.createMany(tasks);
    // This sends a message to the page notifying it of the update
    this.mainWindow.send("download-item-notifier", items);

    // Start downloading immediately if requested
    if (startDownload) {
      const local = this.store.get("local");
      const deleteSegments = this.store.get("deleteSegments");
      items.forEach((task) => {
        this.downloadTaskService.start(task.id, local, deleteSegments);
      });
    }

    return items;
  }

  @handle(EDIT_DOWNLOAD_ITEM)
  async updateDownloadTask(e: IpcMainEvent, task: DownloadTask, startDownload?: boolean) {
    const item = await this.downloadTaskService.update(task);

    // Start downloading immediately if requested
    if (startDownload) {
      const local = this.store.get("local");
      const deleteSegments = this.store.get("deleteSegments");
      await this.downloadTaskService.start(item.id, local, deleteSegments);
    }

    return item;
  }

  @handle(GET_DOWNLOAD_ITEMS)
  async getDownloadTasks(e: IpcMainEvent, pagination: DownloadTaskPagination): Promise<ListPagination> {
    const local = this.store.get("local");
    return await this.downloadTaskService.list(pagination, local, videoPattern);
  }

  @handle(START_DOWNLOAD)
  async startDownloadTask(e: IpcMainEvent, vid: number) {
    const local = this.store.get("local");
    const deleteSegments = this.store.get("deleteSegments");
    await this.downloadTaskService.start(vid, local, deleteSegments);
  }

  @handle(STOP_DOWNLOAD)
  async stopDownloadTask(e: IpcMainEvent, id: number) {
    this.downloadTaskService.stop(id);
  }

  @handle(DELETE_DOWNLOAD_ITEM)
  async deleteDownloadTask(e: IpcMainEvent, id: number) {
    return await this.downloadTaskService.remove(id);
  }
}
