import { provide } from "@inversifyjs/binding-decorators";
import { inject, injectable } from "inversify";
import path from "node:path";
import { glob } from "glob";
import type { DownloadItem, DownloadItemPagination, ListPagination, Task } from "@mediago/shared/common";
import { DownloadStatus } from "@mediago/shared/common";
import VideoRepository from "../dao/repository/VideoRepository";
import TaskQueueService from "./TaskQueueService";
import { TYPES } from "../types";

@injectable()
@provide(TYPES.DownloadManagementService)
export class DownloadManagementService {
  constructor(
    @inject(VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TaskQueueService)
    private readonly taskQueue: TaskQueueService,
  ) {}

  async addDownloadItem(video: Omit<DownloadItem, "id">) {
    return await this.videoRepository.addVideo(video);
  }

  async addDownloadItems(videos: Omit<DownloadItem, "id">[]) {
    return await this.videoRepository.addVideos(videos);
  }

  async editDownloadItem(video: DownloadItem) {
    return await this.videoRepository.editVideo(video);
  }

  async getDownloadItems(
    pagination: DownloadItemPagination,
    localPath: string,
    videoPattern: string,
  ): Promise<ListPagination> {
    const videos = await this.videoRepository.findVideos(pagination);

    const result: ListPagination = {
      total: videos.total,
      list: [],
    };

    for (const video of videos.list) {
      // FIXME: type
      const final: any = { ...video };
      if (video.status === DownloadStatus.Success) {
        const pattern = path.join(localPath, `${video.name}.{${videoPattern}}`);
        const files = await glob(pattern);
        final.exists = files.length > 0;
        final.file = files[0];
      }
      result.list.push(final);
    }

    return result;
  }

  async startDownload(videoId: number, localPath: string, deleteSegments: boolean) {
    const video = await this.videoRepository.findVideo(videoId);
    const { name, url, headers, type, folder } = video;

    const task: Task = {
      id: videoId,
      params: {
        url,
        type,
        local: localPath,
        name,
        headers,
        deleteSegments,
        folder,
      },
    };

    await this.videoRepository.changeVideoStatus(videoId, DownloadStatus.Watting);
    this.taskQueue.addTask(task);
  }

  async stopDownload(id: number) {
    this.taskQueue.stopTask(id);
  }

  async deleteDownloadItem(id: number) {
    return await this.videoRepository.deleteDownloadItem(id);
  }

  async getDownloadLog(id: number) {
    const video = await this.videoRepository.findVideo(id);
    return video.log || "";
  }

  async getVideoFolders() {
    return this.videoRepository.getVideoFolders();
  }

  async exportDownloadList() {
    const videos = await this.videoRepository.findAllVideos();
    return videos.map((video) => `${video.url} ${video.name}`).join("\n");
  }
}
