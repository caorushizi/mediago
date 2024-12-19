import { inject, injectable } from "inversify";
import VideoRepository from "../repository/VideoRepository.ts";
import { TYPES } from "../types.ts";
import ConfigRepository from "../repository/ConfigRepository.ts";
import { DownloadItem, DownloadStatus, Task } from "../interfaces.ts";
import DownloadService from "./DownloadService.ts";

@injectable()
export default class DownloaderService {
  constructor(
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.ConfigRepository)
    private readonly store: ConfigRepository,
    @inject(TYPES.DownloadService)
    private readonly downloadService: DownloadService,
  ) {}

  async startDownload(vid: number) {
    // Find the video you want to download
    const video = await this.videoRepository.findVideo(vid);
    const { name, url, headers, type, folder } = video;
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
        folder,
      },
    };
    await this.videoRepository.changeVideoStatus(vid, DownloadStatus.Watting);
    this.downloadService.addTask(task);
  }

  async downloadNow(video: Omit<DownloadItem, "id">) {
    // Add download
    const item = await this.addDownloadItem(video);
    // Start downloading
    await this.startDownload(item.id);
    return item;
  }

  async addDownloadItem(video: Omit<DownloadItem, "id">) {
    const item = await this.videoRepository.addVideo(video);
    return item;
  }

  async addDownloadItems(videos: Omit<DownloadItem, "id">[]) {
    const items = await this.videoRepository.addVideos(videos);
    return items;
  }

  async editDownloadItem(video: DownloadItem) {
    return this.videoRepository.editVideo(video);
  }

  async getVideoFolders() {
    return this.videoRepository.getVideoFolders();
  }
}
