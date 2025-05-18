import { inject, injectable } from "inversify";
import {
  DownloadItem,
  DownloadItemPagination,
  DownloadStatus,
  Task,
  type Controller,
} from "@mediago/shared/common";
import { get, post } from "../helper/index.ts";
import { TYPES, VideoRepository } from "@mediago/shared/node";
import { Context } from "koa";
import { TaskQueueService } from "@mediago/shared/node";
import Logger from "../vendor/Logger.ts";
import SocketIO from "../vendor/SocketIO.ts";
import StoreService from "../vendor/Store.ts";

@injectable()
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.TaskQueueService)
    private readonly taskQueueService: TaskQueueService,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.SocketIO)
    private readonly socket: SocketIO,
    @inject(TYPES.StoreService)
    private readonly store: StoreService
  ) {}

  @get("/")
  async getFavorites() {
    return false;
  }

  @post("add-download-item")
  async addDownloadItem(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    const item = await this.videoRepository.addVideo(video);

    this.socket.refreshList();

    return item;
  }

  @post("add-download-items")
  async addDownloadItems(ctx: Context) {
    const videos = ctx.request.body as DownloadItem[];
    const items = await this.addDownloadItems1(videos);

    this.socket.refreshList();

    return items;
  }

  @post("get-download-items")
  async getDownloadItems(ctx: Context) {
    const pagination = ctx.request.body as DownloadItemPagination;
    const videos = await this.videoRepository.findVideos(pagination);
    return videos;
  }

  @post("start-download")
  async startDownload(ctx: Context) {
    const { vid } = ctx.request.body as { vid: number };
    await this.startDownload1(vid);
  }

  @post("delete-download-item")
  async deleteDownloadItem(ctx: Context) {
    const { id } = ctx.request.body as { id: number };
    await this.videoRepository.deleteDownloadItem(id);
  }

  @post("download-now")
  async downloadNow(ctx: Context) {
    const video = ctx.request.body as Omit<DownloadItem, "id">;
    await this.downloadNow1(video);
  }

  @post("download-items-now")
  async downloadItemsNow(ctx: Context) {
    const videos = ctx.request.body as Omit<DownloadItem, "id">[];
    // Add download
    const items = await this.addDownloadItems1(videos);
    // Start downloading
    items.forEach((item: any) => this.startDownload1(item.id));
    return items;
  }

  @post("edit-download-now")
  async editDownloadNow(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    const item = await this.editDownloadItem1(video);
    await this.startDownload1(item.id);
    return item;
  }

  @post("edit-download-item")
  async editDownloadItem(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    this.logger.info("editDownloadItem", video);
    return this.editDownloadItem1(video);
  }

  @post("stop-download")
  async stopDownload(ctx: Context) {
    const { id } = ctx.request.body as { id: number };

    this.taskQueueService.stopTask(id);
  }

  @post("get-video-folders")
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
