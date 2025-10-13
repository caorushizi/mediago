import { EventEmitter } from "node:stream";
import { provide } from "@inversifyjs/binding-decorators";
import { safeParseJSON, type DownloadType } from "@mediago/shared-common";
import axios from "axios";
import { EventSource } from "eventsource";
import { injectable } from "inversify";
import { findFreePort, getLocalIP, ServiceRunner } from "../utils";

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
  private port = 0;
  private host = "";

  async start() {
    this.port = await findFreePort({ startPort: 9991 });
    this.host = await getLocalIP();

    const runner = new ServiceRunner({
      binName: "mediago-downloader",
      devDir: "F:\\Workspace\\Projects\\MediaGo\\mediago-core\\bin",
      extraArgs: ["-port", this.port.toString()],
      extraEnv: {
        MEDIAGO_M3U8_BIN: "F:\\Workspace\\Projects\\MediaGo\\mediago\\bin\\win32\\x64\\N_m3u8DL-RE.exe",
        MEDIAGO_BILIBILI_BIN: "F:\\Workspace\\Projects\\MediaGo\\mediago\\bin\\win32\\x64\\BBDown.exe",
        MEDIAGO_DIRECT_BIN: "F:\\Workspace\\Projects\\MediaGo\\mediago\\bin\\win32\\x64\\gopeed.exe",
      },
      host: this.host,
      port: this.port,
    });

    runner.start();

    // 1. 订阅 SSE 接收状态变更
    const eventSource = new EventSource(`http://localhost:${this.port}/api/events`);

    eventSource.addEventListener("download-start", (e: any) => {
      const data = safeParseJSON(e.data, { id: 0 });
      console.log(`任务 ${data.id} 开始下载`);
      startPolling(data.id); // 停止轮询
    });

    eventSource.addEventListener("download-success", (e: any) => {
      const data = safeParseJSON(e.data, { id: 0 });
      console.log(`任务 ${data.id} 下载成功`);
      stopPolling(data.id); // 停止轮询
    });

    eventSource.addEventListener("download-failed", (e: any) => {
      const data = safeParseJSON(e.data, { id: 0 });
      console.log(`任务 ${data.id} 下载失败: ${data}`);
      stopPolling(data.id); // 停止轮询
    });

    const pollingIntervals = new Map();

    // 2. 轮询获取进度
    const startPolling = (taskId: any) => {
      const interval = setInterval(async () => {
        const response = await fetch(`http://localhost:${this.port}/api/tasks/${taskId}`);
        const task: any = await response.json();

        console.log(`进度: ${JSON.stringify(task)}`);

        // 如果任务完成，停止轮询
        if (["success", "failed", "stopped"].includes(task.status)) {
          clearInterval(interval);
        }
      }, 1000); // 每秒查询一次

      // 保存 interval ID 以便后续清理
      pollingIntervals.set(taskId, interval);
    };

    const stopPolling = (taskId: any) => {
      const interval = pollingIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        pollingIntervals.delete(taskId);
      }
    };
  }

  async startTask(opts: DownloadTaskOptions) {
    const url = `http://${this.host}:${this.port}/api/tasks`;
    await axios.post(url, opts);
  }

  async stopTask(id: string) {
    const url = `http://${this.host}:${this.port}/api/tasks/${id}/stop`;
    await axios.post(url);
  }

  async changeConfig(opts: ChangeConfigOptions) {
    const url = `http://${this.host}:${this.port}/api/config`;
    await axios.post(url, opts);
  }
}
