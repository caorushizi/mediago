import { inject, injectable } from "inversify";
import {
  DownloadItem,
  DownloadItemPagination,
  type Controller,
} from "../interfaces.ts";
import { TYPES } from "../types.ts";
import FavoriteRepository from "../repository/FavoriteRepository.ts";
import { get, post } from "../helper/decorator.ts";
import Logger from "../vendor/Logger.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import { Context } from "koa";

@injectable()
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
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
}
