import { provide } from "@inversifyjs/binding-decorators";
import {
  ADD_DOWNLOAD_ITEMS,
  type Controller,
  type DownloadTask,
  type DownloadTaskPagination,
  EDIT_DOWNLOAD_ITEM,
  GET_DOWNLOAD_ITEMS,
  type ListPagination,
  SHOW_DOWNLOAD_DIALOG,
  START_DOWNLOAD,
} from "@mediago/shared-common";
import { DownloaderServer, handle, TYPES } from "@mediago/shared-node";
import type { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";
import GoConfigCache from "../services/go-config-cache";
import WebviewService from "../services/webview.service";

@injectable()
@provide(TYPES.Controller)
export default class DownloadController implements Controller {
  constructor(
    @inject(GoConfigCache)
    private readonly configCache: GoConfigCache,
    @inject(WebviewService)
    private readonly webviewService: WebviewService,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {}

  @handle(SHOW_DOWNLOAD_DIALOG)
  async showDownloadDialog(e: IpcMainEvent, data: DownloadTask) {
    const image = await this.webviewService.captureView();
    this.webviewService.sendToWindow(
      SHOW_DOWNLOAD_DIALOG,
      data,
      image?.toDataURL(),
    );
  }

  @handle(ADD_DOWNLOAD_ITEMS)
  async createDownloadTasks(
    _e: IpcMainEvent,
    tasks: Omit<DownloadTask, "id">[],
    startDownload?: boolean,
  ) {
    const client = this.downloaderServer.getClient();
    const res = await client.addDownloadTasks({
      tasks: tasks.map((v) => ({
        type: v.type,
        url: v.url,
        name: v.name,
        headers: v.headers,
        folder: v.folder,
      })),
      startDownload,
    });
    return res.data;
  }

  @handle(EDIT_DOWNLOAD_ITEM)
  async updateDownloadTask(
    _e: IpcMainEvent,
    task: DownloadTask,
    startDownload?: boolean,
  ) {
    const client = this.downloaderServer.getClient();
    await client.editDownloadTask(task.id, {
      name: task.name,
      url: task.url,
      headers: task.headers ?? undefined,
      folder: task.folder,
    });
    if (startDownload) {
      await client.startDownload(task.id, {
        localPath: this.configCache.get("local"),
        deleteSegments: this.configCache.get("deleteSegments"),
      });
    }
  }

  @handle(GET_DOWNLOAD_ITEMS)
  async getDownloadTasks(
    _e: IpcMainEvent,
    pagination: DownloadTaskPagination,
  ): Promise<ListPagination> {
    const client = this.downloaderServer.getClient();
    const res = await client.getDownloadTasks({
      current: pagination.current,
      pageSize: pagination.pageSize,
      filter: pagination.filter,
      localPath: this.configCache.get("local"),
    });
    return res.data;
  }

  @handle(START_DOWNLOAD)
  async startDownloadTask(_e: IpcMainEvent, vid: number) {
    const client = this.downloaderServer.getClient();
    await client.startDownload(vid, {
      localPath: this.configCache.get("local"),
      deleteSegments: this.configCache.get("deleteSegments"),
    });
  }
}
