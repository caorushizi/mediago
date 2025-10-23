import path from "node:path";
import { EventEmitter } from "node:events";
import { provide } from "@inversifyjs/binding-decorators";
import { ServiceRunner } from "@mediago/service-runner";
import { type DownloadProgress, type DownloadType, safeParseJSON } from "@mediago/shared-common";
import axios from "axios";
import { EventSource } from "eventsource";
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

  async start() {
    const binaryUrl = require.resolve("@mediago/core");
    const binDir = path.dirname(binaryUrl);

    const runner = new ServiceRunner({
      executableName: "mediago-core",
      executableDir: path.resolve(binDir, "files"),
      preferredPort: 9900,
      internal: true,
      extraArgs: [],
      extraEnv: {
        MEDIAGO_M3U8_BIN: path.resolve(binDir, "files/bin/N_m3u8DL-RE"),
        MEDIAGO_BILIBILI_BIN: path.resolve(binDir, "files/bin/BBDown"),
        MEDIAGO_DIRECT_BIN: path.resolve(binDir, "files/bin/gopeed"),
        MEDIAGO_SCHEMA_PATH: path.resolve(binDir, "files/configs/download_schemas.json"),
      },
    });

    await runner.start();

    this.serverUrl = runner.getURL();

    // 1. 订阅 SSE 接收状态变更
    const eventSource = new EventSource(`${this.serverUrl}/api/events`);

    eventSource.addEventListener("download-start", (e: any) => {
      const data = safeParseJSON(e.data, { id: 0 });
      this.emit("download-start", data.id);
    });

    eventSource.addEventListener("download-success", (e: any) => {
      const data = safeParseJSON(e.data, { id: 0 });
      this.emit("download-success", data.id);
    });

    eventSource.addEventListener("download-failed", (e: any) => {
      const data = safeParseJSON(e.data, { id: 0 });
      this.emit("download-failed", data.id);
    });

    // 2. 轮询获取进度
    // FIXME: 需要优化性能
    const startPolling = () => {
      setInterval(async () => {
        const { data } = await axios.get(`${this.serverUrl}/api/tasks/`);

        const taskList = (data.tasks || []).filter((task: any) => {
          return task.percent > 0 && task.percent < 100;
        });
        if (taskList.length === 0) {
          return;
        }

        const tasks: DownloadProgress[] = taskList.map((task: any) => {
          return {
            id: task.id,
            type: task.type as DownloadType,
            percent: task.percent,
            speed: task.speed,
            isLive: task.isLive || false,
          };
        });
        this.emit("download-progress", tasks);
      }, 1000);
    };

    startPolling();
  }

  async startTask(opts: DownloadTaskOptions) {
    const url = `${this.serverUrl}/api/tasks`;
    await axios.post(url, opts);
  }

  async stopTask(id: string) {
    const url = `${this.serverUrl}/api/tasks/${id}/stop`;
    await axios.post(url);
  }

  async changeConfig(opts: ChangeConfigOptions) {
    const url = `${this.serverUrl}/api/config`;
    await axios.post(url, opts);
  }
}
