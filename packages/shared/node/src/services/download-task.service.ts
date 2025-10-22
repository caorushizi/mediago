import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import type { DownloadTask, DownloadTaskPagination, ListPagination } from "@mediago/shared-common";
import { DownloadStatus } from "@mediago/shared-common";
import { glob } from "glob";
import { inject, injectable } from "inversify";
import DownloadTaskRepository from "../dao/repository/download-task.repository";
import { DownloaderServer } from "../worker";
import { videoPattern } from "../utils";

/**
 * Download Task Service (Business Logic Layer)
 *
 * 下载任务管理服务，负责下载任务的业务逻辑处理。
 * Download task management service, responsible for business logic of download tasks.
 *
 * 功能说明：
 * - 下载任务的增删改查
 * - 下载任务的状态管理
 * - 下载任务的启动和停止
 * - 本地文件存在性检查
 * - 下载日志管理
 *
 * @see DownloadTaskRepository - 数据访问层
 * @see DownloadTask - 下载任务类型定义
 * @see DownloadTaskWithFile - 包含文件信息的下载任务类型
 */
@injectable()
@provide()
export class DownloadTaskService {
  constructor(
    @inject(DownloadTaskRepository)
    private readonly downloadTaskRepository: DownloadTaskRepository,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {}

  async create(task: Omit<DownloadTask, "id">) {
    return await this.downloadTaskRepository.create(task);
  }

  async createMany(tasks: Omit<DownloadTask, "id">[]) {
    return await this.downloadTaskRepository.createMany(tasks);
  }

  async update(task: DownloadTask) {
    return await this.downloadTaskRepository.update(task.id, task);
  }

  async list(pagination: DownloadTaskPagination, localPath: string): Promise<ListPagination> {
    const result = await this.downloadTaskRepository.findWithPagination(pagination);

    const list = await Promise.all(
      result.items.map(async (task) => {
        const taskWithFile = { ...task, exists: false, file: undefined as string | undefined };
        if (task.status === DownloadStatus.Success) {
          const pattern = `${task.name}.{${videoPattern}}`;
          const files = await glob(pattern, {
            cwd: localPath,
          });
          taskWithFile.exists = files.length > 0;
          taskWithFile.file = files[0];
        }
        return taskWithFile;
      }),
    );

    return {
      total: result.total,
      list,
    };
  }

  async start(taskId: number, localPath: string, deleteSegments: boolean) {
    const task = await this.downloadTaskRepository.findByIdOrFail(taskId);
    const { name, url, type, folder } = task;

    await this.downloadTaskRepository.updateStatus(taskId, DownloadStatus.Watting);
    this.downloaderServer.startTask({
      deleteSegments,
      folder,
      headers: [],
      id: taskId.toString(),
      localDir: localPath,
      name,
      type,
      url,
    });
  }

  async stop(id: number) {
    this.downloaderServer.stopTask(id.toString());
  }

  async remove(id: number) {
    return await this.downloadTaskRepository.delete(id);
  }

  async getLog(id: number) {
    const task = await this.downloadTaskRepository.findByIdOrFail(id);
    return task.log || "";
  }

  async listFolders() {
    return this.downloadTaskRepository.findDistinctFolders();
  }

  async exportList() {
    const tasks = await this.downloadTaskRepository.findAll("DESC");
    return tasks.map((task) => `${task.url} ${task.name}`).join("\n");
  }

  // Status update methods
  async setStatus(ids: number | number[], status: DownloadStatus): Promise<void> {
    await this.downloadTaskRepository.updateStatus(ids, status);
  }

  async setIsLive(id: number, isLive: boolean = true): Promise<void> {
    await this.downloadTaskRepository.updateIsLive(id, isLive);
  }

  async appendLog(id: number, message: string): Promise<void> {
    await this.downloadTaskRepository.appendLog(id, message);
  }

  // Query methods
  async findById(id: number) {
    return await this.downloadTaskRepository.findById(id);
  }

  async findByIdOrFail(id: number) {
    return await this.downloadTaskRepository.findByIdOrFail(id);
  }

  async findByName(name: string) {
    return await this.downloadTaskRepository.findByName(name);
  }

  async findByUrl(url: string) {
    return await this.downloadTaskRepository.findByUrl(url);
  }

  async findActiveTasks() {
    return await this.downloadTaskRepository.findByStatus([DownloadStatus.Watting, DownloadStatus.Downloading]);
  }

  // Legacy aliases (deprecated)
  async findWaitingAndDownloadingTasks() {
    return await this.findActiveTasks();
  }

  async findWaitingAndDownloadingVideos() {
    return await this.findActiveTasks();
  }

  async addDownloadTask(task: Omit<DownloadTask, "id">) {
    return await this.create(task);
  }

  async addDownloadTasks(tasks: Omit<DownloadTask, "id">[]) {
    return await this.createMany(tasks);
  }

  async editDownloadTask(task: DownloadTask) {
    return await this.update(task);
  }

  async getDownloadTasks(pagination: DownloadTaskPagination, localPath: string): Promise<ListPagination> {
    return await this.list(pagination, localPath);
  }

  async startDownload(taskId: number, localPath: string, deleteSegments: boolean) {
    return await this.start(taskId, localPath, deleteSegments);
  }

  async stopDownload(id: number) {
    return await this.stop(id);
  }

  async deleteDownloadTask(id: number) {
    return await this.remove(id);
  }

  async getDownloadLog(id: number) {
    return await this.getLog(id);
  }

  async getTaskFolders() {
    return await this.listFolders();
  }

  async exportDownloadList() {
    return await this.exportList();
  }
}
