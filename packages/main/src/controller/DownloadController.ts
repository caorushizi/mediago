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
  DownloadService,
  Task,
  DownloadStatus,
} from "../interfaces";
import { TYPES } from "../types";
import { nanoid } from "nanoid";
import { spawnDownload } from "helper";

@injectable()
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.DownloadService)
    private readonly downloadService: DownloadService
  ) {}

  @handle("add-download-item")
  async addDownloadItem(e: IpcMainEvent, video: DownloadItem) {
    return await this.videoRepository.addVideo(video);
  }

  @handle("get-download-items")
  async getDownloadItems(e: IpcMainEvent, pagination: DownloadItemPagination) {
    return await this.videoRepository.findVideos(pagination);
  }

  @handle("start-download")
  async startDownload(e: IpcMainEvent, vid: number) {
    // 查找将要下载的视频
    const video = await this.videoRepository.findVideo(vid);
    if (!video) {
      return Promise.reject("没有找到该视频");
    }
    const { name, url } = video;
    const local = this.storeService.get("local");

    const task: Task = {
      id: vid,
      result: spawnDownload(vid, url, local, name),
    };
    this.downloadService.addTask(task);
    await this.videoRepository.changeVideoStatus(
      vid,
      DownloadStatus.Downloading
    );
  }
}
