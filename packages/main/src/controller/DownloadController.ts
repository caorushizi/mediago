import { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";
import { handle } from "../helper/decorator";
import {
  StoreService,
  LoggerService,
  type Controller,
  VideoRepository,
  DownloadItem,
  DownloadItemPagination,
} from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository
  ) {}

  @handle("add-download-item")
  async addDownloadItem(e: IpcMainEvent, video: DownloadItem) {
    return await this.videoRepository.addVideo(video);
  }

  @handle("get-download-items")
  async getDownloadItems(e: IpcMainEvent, pagination: DownloadItemPagination) {
    return await this.videoRepository.findVideos(pagination);
  }
}
