import { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";
import { handle, videoPattern } from "../helper/index.ts";
import {
  type Controller,
  DownloadItem,
  DownloadItemPagination,
  Task,
  DownloadStatus,
  ListPagination,
} from "@mediago/shared/common";
import { TYPES } from "@mediago/shared/node";
import MainWindow from "../windows/MainWindow.ts";
import ElectronStore from "../vendor/ElectronStore.ts";
import { VideoRepository, TaskQueueService } from "@mediago/shared/node";
import WebviewService from "../services/WebviewService.ts";
import path from "path";
import { glob } from "glob";

@injectable()
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.TaskQueueService)
    private readonly taskQueue: TaskQueueService,
    @inject(TYPES.MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(TYPES.WebviewService)
    private readonly webviewService: WebviewService
  ) {}

  @handle("show-download-dialog")
  async showDownloadDialog(e: IpcMainEvent, data: DownloadItem) {
    const image = await this.webviewService.captureView();
    this.webviewService.sendToWindow(
      "show-download-dialog",
      data,
      image?.toDataURL()
    );
  }

  @handle("add-download-item")
  async addDownloadItem(e: IpcMainEvent, video: Omit<DownloadItem, "id">) {
    const item = await this.videoRepository.addVideo(video);
    // This sends a message to the page notifying it of the update
    this.mainWindow.send("download-item-notifier", item);
    return item;
  }

  @handle("add-download-items")
  async addDownloadItems(e: IpcMainEvent, videos: Omit<DownloadItem, "id">[]) {
    const items = await this.videoRepository.addVideos(videos);
    // This sends a message to the page notifying it of the update
    this.mainWindow.send("download-item-notifier", items);
    return items;
  }

  @handle("edit-download-item")
  async editDownloadItem(e: IpcMainEvent, video: DownloadItem) {
    const item = await this.videoRepository.editVideo(video);
    return item;
  }

  @handle("edit-download-now")
  async editDownloadNow(e: IpcMainEvent, video: DownloadItem) {
    const item = await this.editDownloadItem(e, video);
    await this.startDownload(e, item.id);
    return item;
  }

  @handle("download-now")
  async downloadNow(e: IpcMainEvent, video: Omit<DownloadItem, "id">) {
    // Add download
    const item = await this.addDownloadItem(e, video);
    // Start downloading
    await this.startDownload(e, item.id);
    return item;
  }

  @handle("download-items-now")
  async downloadItemsNow(e: IpcMainEvent, videos: Omit<DownloadItem, "id">[]) {
    // Add download
    const items = await this.addDownloadItems(e, videos);
    // Start downloading
    items.forEach((item) => this.startDownload(e, item.id));
    return items;
  }

  @handle("get-download-items")
  async getDownloadItems(
    e: IpcMainEvent,
    pagination: DownloadItemPagination
  ): Promise<ListPagination> {
    const videos = await this.videoRepository.findVideos(pagination);

    const result: ListPagination = {
      total: videos.total,
      list: [],
    };

    const local = this.store.get("local");
    for (const video of videos.list) {
      // FIXME: type
      const final: any = { ...video };
      if (video.status === DownloadStatus.Success) {
        const pattern = path.join(local, `${video.name}.{${videoPattern}}`);
        const files = await glob(pattern);
        final.exists = files.length > 0;
        final.file = files[0];
      }
      result.list.push(final);
    }

    return result;
  }

  @handle("start-download")
  async startDownload(e: IpcMainEvent, vid: number) {
    // Find the video you want to download
    const video = await this.videoRepository.findVideo(vid);
    const { name, url, headers, type, folder } = video;
    const local = this.store.get("local");

    // Add parameters from the configuration
    const deleteSegments = this.store.get("deleteSegments");

    const task: Task = {
      id: vid,
      params: {
        url,
        type,
        local,
        name,
        headers,
        deleteSegments,
        folder,
      },
    };
    await this.videoRepository.changeVideoStatus(vid, DownloadStatus.Watting);
    this.taskQueue.addTask(task);
  }

  @handle("stop-download")
  async stopDownload(e: IpcMainEvent, id: number) {
    this.taskQueue.stopTask(id);
  }

  @handle("delete-download-item")
  async deleteDownloadItem(e: IpcMainEvent, id: number) {
    return await this.videoRepository.deleteDownloadItem(id);
  }
}
