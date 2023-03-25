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
export default class DownloadServiceImpl implements DownloadService {
  private queue: Task[] = [];

  private active: Task[] = [];

  private limit = 2;

  private debug = process.env.DOWNLOAD_DEBUG;

  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerServiceImpl,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository
  ) {}

  async addTask(task: Task) {
    this.queue.push(task);
    this.runTask();
  }

  async execute(task: Task) {
    try {
      this.log(`running ${task.id}`);
      await task.result;
      this.log(`task ${task.id} finished`);

      await this.videoRepository.changeVideoStatus(
        task.id,
        DownloadStatus.Success
      );
      // this.emit("download-success", task.id);
    } catch (err) {
      this.log(`${task.id} failed`);
      // 传输失败
      // TODO: 下载失败的任务
      await this.videoRepository.changeVideoStatus(
        task.id,
        DownloadStatus.Failed
      );
      // this.emit("download-failed", task.id);
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

  log(msg: string) {
    if (this.debug) {
      this.logger.info(`[TaskRunner] ${msg}`);
    }
  }
}
