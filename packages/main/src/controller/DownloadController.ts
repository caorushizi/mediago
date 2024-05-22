import { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";
import { handle } from "../helper";
import {
  type Controller,
  DownloadItem,
  DownloadItemPagination,
  Task,
  DownloadStatus,
} from "../interfaces";
import { TYPES } from "../types";
import MainWindow from "../windows/MainWindow";
import ElectronStore from "../vendor/ElectronStore";
import DownloadService from "../services/DownloadService";
import VideoRepository from "../repository/VideoRepository";
import WebviewService from "../services/WebviewService";

@injectable()
export default class DownloadController implements Controller {
  constructor(
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.DownloadService)
    private readonly downloadService: DownloadService,
    @inject(TYPES.MainWindow)
    private readonly mainWindow: MainWindow,
    @inject(TYPES.WebviewService)
    private readonly webviewService: WebviewService,
  ) {}

  @handle("show-download-dialog")
  async showDownloadDialog(e: IpcMainEvent, data: DownloadItem) {
    const image = await this.webviewService.captureView();
    this.webviewService.sendToWindow(
      "show-download-dialog",
      data,
      image.toDataURL(),
    );
  }

  @handle("add-download-item")
  async addDownloadItem(e: IpcMainEvent, video: DownloadItem) {
    const item = await this.videoRepository.addVideo(video);
    // 这里向页面发送消息，通知页面更新
    this.mainWindow.send("download-item-notifier", item);
    return item;
  }

  @handle("add-download-items")
  async addDownloadItems(e: IpcMainEvent, videos: DownloadItem[]) {
    const items = await this.videoRepository.addVideos(videos);
    // 这里向页面发送消息，通知页面更新
    this.mainWindow.send("download-item-notifier", items);
    return items;
  }

  @handle("edit-download-item")
  async editDownloadItem(e: IpcMainEvent, video: DownloadItem) {
    const item = await this.videoRepository.editVideo(video);
    return item;
  }

  @handle("download-now")
  async downloadNow(e: IpcMainEvent, video: DownloadItem) {
    // 添加下载项
    const item = await this.addDownloadItem(e, video);
    // 开始下载
    await this.startDownload(e, item.id);
    return item;
  }

  @handle("get-download-items")
  async getDownloadItems(e: IpcMainEvent, pagination: DownloadItemPagination) {
    const videos = await this.videoRepository.findVideos(pagination);
    return videos;
  }

  @handle("start-download")
  async startDownload(e: IpcMainEvent, vid: number) {
    // 查找将要下载的视频
    const video = await this.videoRepository.findVideo(vid);
    const { name, url, headers, type } = video;
    const local = this.store.get("local");

    // 从配置中添加参数
    const deleteSegments = this.store.get("deleteSegments");

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

  @handle("stop-download")
  async stopDownload(e: IpcMainEvent, id: number) {
    this.downloadService.stopTask(id);
  }

  @handle("delete-download-item")
  async deleteDownloadItem(e: IpcMainEvent, id: number) {
    return await this.videoRepository.deleteDownloadItem(id);
  }
}
