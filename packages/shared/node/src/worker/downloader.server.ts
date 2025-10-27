import { EventEmitter } from "node:events";
import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { type CreateTaskResponse, MediaGoClient } from "@mediago/core-sdk";
import { ServiceRunner } from "@mediago/service-runner";
import type { DownloadType } from "@mediago/shared-common";
import { injectable } from "inversify";

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

export interface ChangeConfigOptions {
  maxRunner?: number;
  proxy?: string;
}

@injectable()
@provide()
export class DownloaderServer extends EventEmitter {
  private serverUrl = "";
  private client: MediaGoClient | null = null;

  async start() {
    const coreBin = require.resolve("@mediago/core");
    const coreBinDir = path.dirname(coreBin);
    const dpesBin = require.resolve("@mediago/deps");
    const dpesBinDir = path.dirname(dpesBin);

    const devConfig = {
      log_level: "debug",
      log_dir: "./logs",
      schema_path: path.resolve(coreBinDir, "files/config.json"),
      m3u8_bin: path.resolve(dpesBinDir, "bin/N_m3u8DL-RE"),
      bilibili_bin: path.resolve(dpesBinDir, "bin/BBDown"),
      direct_bin: path.resolve(dpesBinDir, "bin/gopeed"),
      max_runner: 3,
      local_dir: "/Users/caorushizi/temp/videos",
      delete_segments: true,
      proxy: "",
      use_proxy: false,
    };

    const runner = new ServiceRunner({
      executableName: "mediago-core",
      executableDir: path.resolve(coreBinDir, "files"),
      preferredPort: 9900,
      internal: true,
      extraArgs: [
        `-log-level=${devConfig.log_level}`,
        `-log-dir=${devConfig.log_dir}`,
        `-schema-path=${devConfig.schema_path}`,
        `-m3u8-bin=${devConfig.m3u8_bin}`,
        `-bilibili-bin=${devConfig.bilibili_bin}`,
        `-direct-bin=${devConfig.direct_bin}`,
        `-max-runner=${devConfig.max_runner}`,
        `-local-dir=${devConfig.local_dir}`,
        `-delete-segments=${devConfig.delete_segments}`,
        `-proxy=${devConfig.proxy}`,
        `-use-proxy=${devConfig.use_proxy}`,
      ],
    });

    await runner.start();

    this.serverUrl = runner.getURL();

    this.client = new MediaGoClient({
      baseURL: this.serverUrl,
    });
    const events = this.client.streamEvents();

    events.on("download-start", (payload) => {
      this.emit("download-start", payload.id);
    });

    events.on("download-success", (payload) => {
      this.emit("download-success", payload.id);
    });

    events.on("download-failed", (payload) => {
      this.emit("download-failed", payload.id);
    });

    // 2. 轮询获取进度
    // FIXME: 需要优化性能
    const startPolling = () => {
      setInterval(async () => {
        if (!this.client) {
          return;
        }

        const { data } = await this.client.listTasks();

        const tasks = data.tasks
          .map((task) => {
            return {
              id: task.id,
              type: task.type,
              percent: task.percent || 0,
              speed: task.speed,
              isLive: task.isLive || false,
            };
          })
          .filter((task) => {
            return task.percent > 0 && task.percent < 100;
          });
        if (tasks.length === 0) {
          return;
        }

        this.emit("download-progress", tasks);
      }, 1000);
    };

    startPolling();
  }

  async startTask(opts: DownloadTaskOptions): Promise<CreateTaskResponse | undefined> {
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

  async changeConfig(opts: ChangeConfigOptions) {
    return this.client?.updateConfig(opts);
  }
}
