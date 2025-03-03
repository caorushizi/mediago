import { inject, injectable } from "inversify";
import {
  DownloadItem,
  DownloadItemPagination,
  type Controller,
} from "../interfaces.ts";
import { TYPES } from "../types.ts";
import { get, post } from "../helper/index.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import { Context } from "koa";
import DownloaderService from "../services/DownloaderService.ts";
import DownloadService from "../services/DownloadService.ts";
import Logger from "../vendor/Logger.ts";
import SocketIO from "../vendor/SocketIO.ts";

@injectable()
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.DownloaderService)
    private readonly downloaderService: DownloaderService,
    @inject(TYPES.DownloadService)
    private readonly downloadService: DownloadService,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.SocketIO)
    private readonly socket: SocketIO
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
    const items = await this.downloaderService.addDownloadItems(videos);

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
    await this.downloaderService.startDownload(vid);
  }

  @post("delete-download-item")
  async deleteDownloadItem(ctx: Context) {
    const { id } = ctx.request.body as { id: number };
    await this.videoRepository.deleteDownloadItem(id);
  }

  @post("download-now")
  async downloadNow(ctx: Context) {
    const video = ctx.request.body as Omit<DownloadItem, "id">;
    await this.downloaderService.downloadNow(video);
  }

  @post("download-items-now")
  async downloadItemsNow(ctx: Context) {
    const videos = ctx.request.body as Omit<DownloadItem, "id">[];
    // Add download
    const items = await this.downloaderService.addDownloadItems(videos);
    // Start downloading
    items.forEach((item) => this.downloaderService.startDownload(item.id));
    return items;
  }

  @post("edit-download-now")
  async editDownloadNow(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    const item = await this.downloaderService.editDownloadItem(video);
    await this.downloaderService.startDownload(item.id);
    return item;
  }

  @post("edit-download-item")
  async editDownloadItem(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    this.logger.info("editDownloadItem", video);
    return this.downloaderService.editDownloadItem(video);
  }

  @post("stop-download")
  async stopDownload(ctx: Context) {
    const { id } = ctx.request.body as { id: number };

    this.downloadService.stopTask(id);
  }

  @post("get-video-folders")
  async getVideoFolders() {
    return this.downloaderService.getVideoFolders();
  }
}
