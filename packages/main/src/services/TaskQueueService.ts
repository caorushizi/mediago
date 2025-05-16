import EventEmitter from "events";
import { inject, injectable } from "inversify";
import { DownloadParams, Task } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import ElectronStore from "../vendor/ElectronStore.ts";
import i18n from "../i18n/index.ts";
import { processList } from "../config/download.ts";
import DownloaderService from "./DownloaderService.ts";

@injectable()
export default class TaskQueueService extends EventEmitter {
  private queue: Task[] = [];

  private active: Task[] = [];

  private limit: number;

  private signal: Record<number, AbortController> = {};

  constructor(
    @inject(TYPES.ElectronStore)
    private readonly storeService: ElectronStore,
    @inject(TYPES.DownloaderService)
    private readonly downloaderService: DownloaderService
  ) {
    super();

    const maxRunner = this.storeService.get("maxRunner");
    this.limit = maxRunner;

    this.storeService.onDidChange("maxRunner", (maxRunner) => {
      maxRunner && (this.limit = maxRunner);
    });
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
      };

      const { proxy, downloadProxySwitch } = this.storeService.store;
      if (downloadProxySwitch && proxy) {
        params.proxy = proxy;
      }

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
    const program = processList
      .filter((i) => i.platform.includes(process.platform))
      .filter((i) => i.type === params.type);

    if (program.length === 0) {
      return Promise.reject(new Error(i18n.t("unsupportedDownloadType")));
    }

    const [schema] = program;
    await this.downloaderService.download(params, schema);
  }
}
