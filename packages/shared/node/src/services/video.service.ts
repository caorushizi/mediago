import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import type { DownloadItem, DownloadItemPagination, ListPagination, Task } from "@mediago/shared-common";
import { DownloadStatus } from "@mediago/shared-common";
import { glob } from "glob";
import { inject, injectable } from "inversify";
import VideoRepository from "../dao/repository/video.repository";
import { TYPES } from "../types";
import { DownloaderServer } from "../worker";

@injectable()
@provide(TYPES.DownloadManagementService)
export class DownloadManagementService {
  constructor(
    @inject(VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
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

    await this.videoRepository.changeVideoStatus(videoId, DownloadStatus.Watting);
    this.downloaderServer.startTask({
      deleteSegments,
      folder,
      headers: [],
      id: videoId.toString(),
      localDir: localPath,
      name,
      type,
      url,
    });
  }

  async stopDownload(id: number) {
    this.downloaderServer.stopTask(id.toString());
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
