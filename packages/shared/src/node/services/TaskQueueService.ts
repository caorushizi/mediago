import EventEmitter from "events";
import { inject, injectable } from "inversify";
import { DownloadParams, Task } from "@mediago/shared/common";
import { TYPES } from "@mediago/shared/node";
import { i18n } from "@mediago/shared/common";
import { downloadSchemaList } from "../config/download.ts";
import DownloaderService from "./DownloaderService.ts";

/**
 * Task queue service
 *
 * @description
 * 1. Add task
 * 2. Stop task
 * 3. Execute task
 * 4. Process task
 * 5. Remove task
 */
@injectable()
export default class TaskQueueService extends EventEmitter {
  private queue: Task[] = [];

  private active: Task[] = [];

  // TODO: config
  private limit: number = 2;

  private proxy: string = "";

  private signal: Record<number, AbortController> = {};

  constructor(
    @inject(TYPES.DownloaderService)
    private readonly downloaderService: DownloaderService
  ) {
    super();
  }

  public init({ maxRunner, proxy }: { maxRunner: number; proxy: string }) {
    this.limit = maxRunner;
    this.proxy = proxy;
  }

  public changeMaxRunner(maxRunner: number) {
    this.limit = maxRunner;
  }

  public changeProxy(proxy: string) {
    this.proxy = proxy;
  }

  async addTask(task: Task) {
    this.queue.push(task);
    this.runTask();
  }

  async stopTask(id: number) {
    if (this.signal[id]) {
      this.signal[id].abort();
    }
  }

  async execute(task: Task) {
    try {
      this.emit("download-start", task.id);

      const controller = new AbortController();
      this.signal[task.id] = controller;

      const callback = (type: string, data: any) => {
        if (type === "progress") {
          if (data.type === "progress") {
            this.emit("download-progress", data);
          } else if (data.type === "ready") {
            this.emit("download-ready-start", data);
            if (data.isLive) {
              this.removeTask(data.id);
            }
          }
        }
        if (type === "message") {
          this.emit("download-message", data.id, data.message);
        }
      };

      const params: DownloadParams = {
        ...task.params,
        id: task.id,
        abortSignal: controller,
        callback,
        proxy: this.proxy,
      };

      await this.process(params);
      delete this.signal[task.id];
      this.emit("download-success", task.id);
    } catch (err: any) {
      if (err.message === "AbortError") {
        this.emit("download-stop", task.id);
      } else {
        this.emit("download-failed", task.id, err);
      }
    } finally {
      this.removeTask(task.id);

      // Transmission complete
      if (this.queue.length === 0 && this.active.length === 0) {
        // this.emit("download-finish");
      }
    }
  }

  removeTask(id: number) {
    // Process the currently active task
    const doneId = this.active.findIndex((i) => i.id === id);
    this.active.splice(doneId, 1);
    // Process completed tasks
    if (this.active.length < this.limit) {
      this.runTask();
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

  async process(params: DownloadParams): Promise<void> {
    const program = downloadSchemaList
      .filter((i) => i.platform.includes(process.platform))
      .filter((i) => i.type === params.type);

    if (program.length === 0) {
      return Promise.reject(new Error(i18n.t("unsupportedDownloadType")));
    }

    const [schema] = program;
    await this.downloaderService.download(params, schema);
  }
}
