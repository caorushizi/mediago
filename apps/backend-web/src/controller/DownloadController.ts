import { provide } from "@inversifyjs/binding-decorators";
import {
  type Controller,
  type DownloadItem,
  type DownloadItemPagination,
  DownloadStatus,
  type Task,
} from "@mediago/shared/common";
import { TaskQueueService, TYPES, VideoRepository } from "@mediago/shared/node";
import { inject, injectable } from "inversify";
import type { Context } from "koa";
import { handle } from "../helper/index";
import Logger from "../vendor/Logger";
import SocketIO from "../vendor/SocketIO";
import StoreService from "../vendor/Store";

@injectable()
@provide(TYPES.Controller)
export default class DownloadController implements Controller {
  constructor(
    @inject(VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TaskQueueService)
    private readonly taskQueueService: TaskQueueService,
    @inject(Logger)
    private readonly logger: Logger,
    @inject(SocketIO)
    private readonly socket: SocketIO,
    @inject(StoreService)
    private readonly store: StoreService,
  ) {}

  @handle("add-download-item")
  async addDownloadItem(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    const item = await this.videoRepository.addVideo(video);

    this.socket.refreshList();

    return item;
  }

  @handle("add-download-items")
  async addDownloadItems(ctx: Context) {
    const videos = ctx.request.body as DownloadItem[];
    const items = await this.addDownloadItems1(videos);

    this.socket.refreshList();

    return items;
  }

  @handle("get-download-items")
  async getDownloadItems(ctx: Context) {
    const pagination = ctx.request.body as DownloadItemPagination;
    const videos = await this.videoRepository.findVideos(pagination);
    return videos;
  }

  @handle("start-download")
  async startDownload(ctx: Context) {
    const { vid } = ctx.request.body as { vid: number };
    await this.startDownload1(vid);
  }

  @handle("delete-download-item")
  async deleteDownloadItem(ctx: Context) {
    const { id } = ctx.request.body as { id: number };
    await this.videoRepository.deleteDownloadItem(id);
  }

  @handle("download-now")
  async downloadNow(ctx: Context) {
    const video = ctx.request.body as Omit<DownloadItem, "id">;
    await this.downloadNow1(video);
  }

  @handle("download-items-now")
  async downloadItemsNow(ctx: Context) {
    const videos = ctx.request.body as Omit<DownloadItem, "id">[];
    // Add download
    const items = await this.addDownloadItems1(videos);
    // Start downloading
    items.forEach((item: any) => {
      this.startDownload1(item.id);
    });
    return items;
  }

  @handle("edit-download-now")
  async editDownloadNow(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    const item = await this.editDownloadItem1(video);
    await this.startDownload1(item.id);
    return item;
  }

  @handle("edit-download-item")
  async editDownloadItem(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    this.logger.info("editDownloadItem", video);
    return this.editDownloadItem1(video);
  }

  @handle("stop-download")
  async stopDownload(ctx: Context) {
    const { id } = ctx.request.body as { id: number };

    this.taskQueueService.stopTask(id);
  }

  @handle("get-video-folders")
  async getVideoFolders() {
    return this.getVideoFolders1();
  }

  private async startDownload1(vid: number) {
    // Find the video you want to download
    const video = await this.videoRepository.findVideo(vid);
    const { name, url, headers, type, folder } = video;
    const local = await this.store.get("local");
    const deleteSegments = await this.store.get("deleteSegments");

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
    this.taskQueueService.addTask(task);
  }

  async downloadNow1(video: Omit<DownloadItem, "id">) {
    // Add download
    const item = await this.addDownloadItem1(video);
    // Start downloading
    await this.startDownload1(item.id);
    return item;
  }

  async addDownloadItem1(video: Omit<DownloadItem, "id">) {
    const item = await this.videoRepository.addVideo(video);
    return item;
  }

  async addDownloadItems1(videos: Omit<DownloadItem, "id">[]) {
    const items = await this.videoRepository.addVideos(videos);
    return items;
  }

  async editDownloadItem1(video: DownloadItem) {
    return this.videoRepository.editVideo(video);
  }

  async getVideoFolders1() {
    return this.videoRepository.getVideoFolders();
  }
}
