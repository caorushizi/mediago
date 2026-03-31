import { provide } from "@inversifyjs/binding-decorators";
import {
  ADD_DOWNLOAD_ITEMS,
  type Controller,
  DELETE_DOWNLOAD_ITEM,
  type DownloadTask,
  type DownloadTaskPagination,
  EDIT_DOWNLOAD_ITEM,
  GET_DOWNLOAD_ITEMS,
  GET_VIDEO_FOLDERS,
  START_DOWNLOAD,
  STOP_DOWNLOAD,
} from "@mediago/shared-common";
import { DownloaderServer, handle, TYPES } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import ServerConfigCache from "../services/server-config-cache";

@injectable()
@provide(TYPES.Controller)
export default class DownloadController implements Controller {
  constructor(
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
    @inject(ServerConfigCache)
    private readonly configCache: ServerConfigCache,
  ) {}

  @handle(ADD_DOWNLOAD_ITEMS)
  async createDownloadTasks(params: {
    videos: Omit<DownloadTask, "id">[];
    startDownload?: boolean;
  }) {
    const client = this.downloaderServer.getClient();
    const tasks = params.videos.map((v) => ({
      type: v.type,
      url: v.url,
      name: v.name,
      headers: v.headers,
      folder: v.folder,
    }));
    const res = await client.addDownloadTasks({
      tasks,
      startDownload: params.startDownload,
    });
    return res.data;
  }

  @handle(GET_DOWNLOAD_ITEMS)
  async getDownloadTasks(pagination: DownloadTaskPagination) {
    const client = this.downloaderServer.getClient();
    const res = await client.getDownloadTasks({
      current: pagination.current,
      pageSize: pagination.pageSize,
      filter: pagination.filter,
      localPath: this.configCache.get("local"),
    });
    return res.data;
  }

  @handle(START_DOWNLOAD)
  async startDownloadTask(params: { vid: number }) {
    const client = this.downloaderServer.getClient();
    await client.startDownload(params.vid, {
      localPath: this.configCache.get("local"),
      deleteSegments: this.configCache.get("deleteSegments"),
    });
  }

  @handle(DELETE_DOWNLOAD_ITEM)
  async deleteDownloadTask(params: { id: number }) {
    const client = this.downloaderServer.getClient();
    await client.deleteDownloadTask(params.id);
  }

  @handle(EDIT_DOWNLOAD_ITEM)
  async updateDownloadTask(params: {
    video: DownloadTask;
    startDownload?: boolean;
  }) {
    const client = this.downloaderServer.getClient();
    const { video, startDownload } = params;
    await client.editDownloadTask(video.id, {
      name: video.name,
      url: video.url,
      headers: video.headers ?? undefined,
      folder: video.folder,
    });
    if (startDownload) {
      await client.startDownload(video.id, {
        localPath: this.configCache.get("local"),
        deleteSegments: this.configCache.get("deleteSegments"),
      });
    }
  }

  @handle(STOP_DOWNLOAD)
  async stopDownloadTask(params: { id: number }) {
    const client = this.downloaderServer.getClient();
    await client.stopDownload(params.id);
  }

  @handle(GET_VIDEO_FOLDERS)
  async getVideoFolders() {
    const client = this.downloaderServer.getClient();
    const res = await client.getDownloadFolders();
    return res.data;
  }
}
