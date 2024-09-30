import { inject, injectable } from "inversify";
import {
  DownloadItem,
  DownloadItemPagination,
  DownloadStatus,
  Task,
  type Controller,
} from "../interfaces.ts";
import { TYPES } from "../types.ts";
import FavoriteRepository from "../repository/FavoriteRepository.ts";
import { get, post } from "../helper/index.ts";
import Logger from "../vendor/Logger.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import { Context } from "koa";
import ConfigService from "../services/ConfigService.ts";
import DownloadService from "../services/DownloadService.ts";

@injectable()
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.ConfigService)
    private readonly store: ConfigService,
    @inject(TYPES.DownloadService)
    private readonly downloadService: DownloadService,
  ) {}

  @get("/")
  async getFavorites() {
    return false;
  }

  @post("add-download-item")
  async addDownloadItem(ctx: Context) {
    const video = ctx.request.body as DownloadItem;
    const item = await this.videoRepository.addVideo(video);
    return item;
  }

  @post("add-download-items")
  async addDownloadItems(ctx: Context) {
    const videos = ctx.request.body as DownloadItem[];
    const items = await this.videoRepository.addVideos(videos);
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
    // 查找将要下载的视频
    const video = await this.videoRepository.findVideo(vid);
    console.log("video", video);
    const { name, url, headers, type } = video;
    const { local, deleteSegments } = await this.store.getConfig();

    const task: Task = {
      id: vid,
      params: {
        url,
        type,
        local,
        name,
        headers,
        deleteSegments,
      },
    };
    await this.videoRepository.changeVideoStatus(vid, DownloadStatus.Watting);
    this.downloadService.addTask(task);
  }
}
