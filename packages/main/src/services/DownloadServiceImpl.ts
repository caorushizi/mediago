import EventEmitter from "events";
import { inject, injectable } from "inversify";
import {
  DownloadService,
  DownloadStatus,
  Task,
  VideoRepository,
} from "../interfaces";
import { TYPES } from "../types";
import LoggerServiceImpl from "./LoggerServiceImpl";

@injectable()
export default class DownloadServiceImpl
  extends EventEmitter
  implements DownloadService
{
  private queue: Task[] = [];

  private active: Task[] = [];

  private limit = 2;

  private debug = process.env.DOWNLOAD_DEBUG;

  private signal: Record<number, AbortController> = {};

  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerServiceImpl,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository
  ) {
    super();
  }

  async addTask(task: Task) {
    this.queue.push(task);
    this.runTask();
  }

  async stopTask(id: number) {
    if (this.signal[id]) {
      this.log(`taskId: ${id} stop`);
      this.signal[id].abort();
    }
  }

  async execute(task: Task) {
    try {
      await this.videoRepository.changeVideoStatus(
        task.id,
        DownloadStatus.Downloading
      );
      this.emit("download-start", task.id);

      this.log(`taskId: ${task.id} start`);
      const controller = new AbortController();
      this.signal[task.id] = controller;
      await task.process(task.id, controller, ...task.params);
      delete this.signal[task.id];
      this.log(`taskId: ${task.id} success`);

      await this.videoRepository.changeVideoStatus(
        task.id,
        DownloadStatus.Success
      );
      this.emit("download-success", task.id);
    } catch (err: any) {
      this.log(`taskId: ${task.id} failed`);
      if (err.name === "AbortError") {
        // 下载暂停
        await this.videoRepository.changeVideoStatus(
          task.id,
          DownloadStatus.Stopped
        );
        this.emit("download-stop", task.id);
      } else {
        // 下载失败
        await this.videoRepository.changeVideoStatus(
          task.id,
          DownloadStatus.Failed
        );
        this.emit("download-failed", task.id, err);
      }
    } finally {
      // 处理当前正在活动的任务
      const doneId = this.active.findIndex((i) => i.id === task.id);
      this.active.splice(doneId, 1);
      // 处理完成的任务
      this.runTask();
      // 传输完成
      if (this.queue.length === 0 && this.active.length === 0) {
        // this.emit("download-finish");
      }
    }
  }

  runTask() {
    while (this.active.length < this.limit && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.active.push(task);
        this.execute(task);
      }
    }
  }

  log(...args: any[]) {
    if (this.debug) {
      this.logger.info(`[DownloadService] `, ...args);
    }
  }
}
