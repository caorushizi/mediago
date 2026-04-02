import { EventEmitter } from "node:events";
import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import {
  type CreateTaskResponse,
  MediaGoClient,
  TaskStatus,
} from "@mediago/core-sdk";
import { ServiceRunner } from "@mediago/service-runner";
import {
  DownloadProgress,
  DownloadStatus,
  type DownloadType,
} from "@mediago/shared-common";
import { inject, injectable } from "inversify";
import {
  resolveCoreBinaries,
  resolveDepsBinaries,
} from "../utils/binaryResolver";
import ElectronLogger from "../vendor/ElectronLogger";

export interface DownloadTaskOptions {
  deleteSegments: boolean;
  folder?: string;
  headers?: string[];
  id: string;
  localDir: string;
  name: string;
  proxy?: string;
  type: DownloadType;
  url: string;
}

export interface DownloadServiceOptions {
  logDir: string;
  dbPath: string;
}

@injectable()
@provide()
export class DownloaderServer extends EventEmitter {
  private serverUrl = "";
  private client: MediaGoClient | null = null;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {
    super();
  }

  async start(opts: DownloadServiceOptions) {
    const core = resolveCoreBinaries();
    const deps = resolveDepsBinaries();

    this.logger.info("Resolved core binary:", path.dirname(core.coreBin));

    const runner = new ServiceRunner({
      executableName: "mediago-core",
      executableDir: path.dirname(core.coreBin),
      preferredPort: 39719,
      internal: false,
      extraArgs: [
        `-log-level=info`,
        `-log-dir=${opts.logDir}`,
        `-schema-path=${core.coreConfig}`,
        `-m3u8-bin=${deps.n_m3u8dl_re}`,
        `-bilibili-bin=${deps.bbdown}`,
        `-direct-bin=${deps.gopeed}`,
        `-ffmpeg-bin=${deps.ffmpeg}`,
        `-db-path=${opts.dbPath}`,
        `-config-dir=${path.dirname(opts.dbPath)}`,
      ],
    });

    await runner.start();

    this.serverUrl = runner.getURL();

    this.logger.info("Downloader server started at:", this.serverUrl);

    this.client = new MediaGoClient({
      baseURL: this.serverUrl,
    });
    const events = this.client.streamEvents();

    events.on("download-start", (payload) => {
      this.emit("download-start", payload.id);
      this.startPolling();
    });

    events.on("download-success", (payload) => {
      this.emit("download-success", payload.id);
      this.stopPollingIfIdle();
    });

    events.on("download-failed", (payload) => {
      this.emit("download-failed", payload.id, payload.error);
      this.stopPollingIfIdle();
    });

    events.on("download-stop", (payload) => {
      this.emit("download-stop", payload.id);
      this.stopPollingIfIdle();
    });

    events.on("config-changed", (payload) => {
      this.emit("config-changed", payload.key, payload.value);
    });
  }

  async startTask(
    opts: DownloadTaskOptions,
  ): Promise<CreateTaskResponse | undefined> {
    const taskResult = await this.client?.createTask({
      id: opts.id,
      type: opts.type as any,
      url: opts.url,
      name: opts.name,
      folder: opts.folder,
      headers: opts.headers,
    });
    return taskResult?.data;
  }

  async stopTask(id: string) {
    return this.client?.stopTask(id);
  }

  async getTaskLogs(id: string) {
    const logResult = await this.client?.getTaskLogs(id);
    return logResult?.data.log || "";
  }

  getClient(): MediaGoClient {
    if (!this.client) {
      throw new Error("DownloaderServer not started");
    }
    return this.client;
  }

  async getURL() {
    return this.serverUrl;
  }

  private startPolling() {
    if (this.pollingTimer) return;
    this.pollingTimer = setInterval(async () => {
      if (!this.client) return;

      try {
        const { data } = await this.client.listTasks();

        const tasks: DownloadProgress[] = data.tasks
          .filter(
            (task) =>
              task.percent &&
              task.percent > 0 &&
              task.percent < 100 &&
              task.status === TaskStatus.Downloading,
          )
          .map((task) => ({
            id: Number(task.id),
            type: task.type,
            percent: String(task.percent || 0),
            speed: task.speed || "",
            isLive: task.isLive || false,
            status: task.status as unknown as DownloadStatus,
          }));

        if (tasks.length > 0) {
          this.emit("download-progress", tasks);
        }
      } catch {
        // ignore
      }
    }, 1000);
  }

  private stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private async stopPollingIfIdle() {
    if (!this.client) return;
    try {
      const { data } = await this.client.listTasks();
      const hasActive = data.tasks.some(
        (task) => task.status === TaskStatus.Downloading,
      );
      if (!hasActive) {
        this.stopPolling();
      }
    } catch {
      // ignore
    }
  }
}
