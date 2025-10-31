import { provide } from "@inversifyjs/binding-decorators";
import type {
  DownloadTask,
  DownloadTaskPagination,
  ListPagination,
} from "@mediago/shared-common";
import { DownloadStatus, DownloadType } from "@mediago/shared-common";
import { glob } from "glob";
import { inject, injectable } from "inversify";
import DownloadTaskRepository from "../dao/repository/download-task.repository";
import { DownloaderServer } from "../worker";
import { getPageTitle, randomName, videoPattern } from "../utils";
import { Video } from "../dao";
import { t } from "i18next";

@injectable()
@provide()
export class DownloadTaskService {
  constructor(
    @inject(DownloadTaskRepository)
    private readonly downloadTaskRepository: DownloadTaskRepository,
    @inject(DownloaderServer)
    private readonly downloaderServer: DownloaderServer,
  ) {
    this.downloaderServer.on("download-success", this.onTaskSuccess);
    this.downloaderServer.on("download-failed", this.onTaskFailed);
    this.downloaderServer.on("download-start", this.onTaskStart);
  }

  private onTaskSuccess = async (taskId: number) => {
    return this.downloadTaskRepository.updateStatus(
      taskId,
      DownloadStatus.Success,
    );
  };

  private onTaskFailed = async (taskId: number) => {
    return this.downloadTaskRepository.updateStatus(
      taskId,
      DownloadStatus.Failed,
    );
  };

  private onTaskStart = async (taskId: number) => {
    return this.downloadTaskRepository.updateStatus(
      taskId,
      DownloadStatus.Downloading,
    );
  };

  async addDownloadTask(task: Omit<DownloadTask, "id">) {
    // 先判断数据库中是否有同名的任务
    let title = task.name || "";

    if (!title.trim() && task.type === DownloadType.bilibili) {
      title = await getPageTitle(task.url);
    } else if (!title.trim()) {
      title = `${t("untitled")}-${randomName()}`;
    }
    const existingTask = await this.downloadTaskRepository.findByName(title);
    if (existingTask) {
      title = `${title}-${randomName()}`;
    }
    const taskWithTitle = {
      ...task,
      name: title,
    };
    return this.downloadTaskRepository.create(taskWithTitle);
  }

  async addDownloadTasks(tasks: Omit<DownloadTask, "id">[]) {
    const tasksWithTitles = await Promise.all(
      tasks.map(async (task) => {
        let title = task.name || "";
        if (!title.trim() && task.type === DownloadType.bilibili) {
          title = await getPageTitle(task.url);
        } else if (!title.trim()) {
          title = `${t("untitled")}-${randomName()}`;
        }
        const existingTask =
          await this.downloadTaskRepository.findByName(title);
        if (existingTask) {
          title = `${title}-${randomName()}`;
        }
        return {
          ...task,
          name: title,
        };
      }),
    );
    return this.downloadTaskRepository.createMany(tasksWithTitles);
  }

  async editDownloadTask(task: DownloadTask) {
    return this.downloadTaskRepository.update(task.id, task);
  }

  async getDownloadTasks(
    pagination: DownloadTaskPagination,
    localPath: string,
  ): Promise<ListPagination> {
    const result =
      await this.downloadTaskRepository.findWithPagination(pagination);

    const list = await Promise.all(
      result.items.map(async (task) => {
        const taskWithFile = {
          ...task,
          exists: false,
          file: undefined as string | undefined,
        };
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

  async startDownload(
    taskId: number,
    localPath: string,
    deleteSegments: boolean,
  ) {
    const task = await this.downloadTaskRepository.findByIdOrFail(taskId);
    const { name, url, type, folder } = task;

    await this.downloadTaskRepository.updateStatus(
      taskId,
      DownloadStatus.Watting,
    );
    const taskResult = await this.downloaderServer.startTask({
      deleteSegments,
      folder,
      headers: [],
      id: taskId.toString(),
      localDir: localPath,
      name,
      type,
      url,
    });

    if (taskResult) {
      const status =
        taskResult.status === "downloading"
          ? DownloadStatus.Downloading
          : DownloadStatus.Watting;
      await this.downloadTaskRepository.updateStatus(taskId, status);
    } else {
      await this.downloadTaskRepository.updateStatus(
        taskId,
        DownloadStatus.Failed,
      );
    }
  }

  async stopDownload(id: number) {
    return this.downloaderServer.stopTask(id.toString());
  }

  async deleteDownloadTask(id: number) {
    return this.downloadTaskRepository.delete(id);
  }

  async getDownloadLog(id: number) {
    const logs = await this.downloaderServer.getTaskLogs(id.toString());
    console.log("Retrieved logs:", logs);
    return logs;
  }

  async getTaskFolders() {
    return this.downloadTaskRepository.findDistinctFolders();
  }

  async exportDownloadList() {
    const tasks = await this.downloadTaskRepository.findAll("DESC");
    return tasks.map((task) => `${task.url} ${task.name}`).join("\n");
  }

  // Status update methods
  async setStatus(
    ids: number | number[],
    status: DownloadStatus,
  ): Promise<void> {
    return this.downloadTaskRepository.updateStatus(ids, status);
  }

  async setIsLive(id: number, isLive: boolean = true): Promise<Video> {
    return this.downloadTaskRepository.updateIsLive(id, isLive);
  }

  async appendLog(id: number, message: string): Promise<Video> {
    return this.downloadTaskRepository.appendLog(id, message);
  }

  // Query methods
  async findById(id: number) {
    return this.downloadTaskRepository.findById(id);
  }

  async findByIdOrFail(id: number) {
    return this.downloadTaskRepository.findByIdOrFail(id);
  }

  async findByName(name: string) {
    return this.downloadTaskRepository.findByName(name);
  }

  async findByUrl(url: string) {
    return this.downloadTaskRepository.findByUrl(url);
  }

  async findActiveTasks() {
    return this.downloadTaskRepository.findByStatus([
      DownloadStatus.Watting,
      DownloadStatus.Downloading,
    ]);
  }
}
