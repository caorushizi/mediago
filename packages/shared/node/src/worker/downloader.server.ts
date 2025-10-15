import path from "node:path";
import { EventEmitter } from "node:stream";
import { provide } from "@inversifyjs/binding-decorators";
import { type DownloadType, safeParseJSON } from "@mediago/shared-common";
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

    const binaryUrl = require.resolve("@mediago/core");

    const runner = new ServiceRunner({
      binName: "bin/mediago-core",
      devDir: path.dirname(binaryUrl),
      extraArgs: ["-port", this.port.toString()],
      extraEnv: {
        MEDIAGO_M3U8_BIN: "F:\\Workspace\\Projects\\MediaGo\\mediago\\bin\\win32\\x64\\N_m3u8DL-RE.exe",
        MEDIAGO_BILIBILI_BIN: "F:\\Workspace\\Projects\\MediaGo\\mediago\\bin\\win32\\x64\\BBDown.exe",
        MEDIAGO_DIRECT_BIN: "F:\\Workspace\\Projects\\MediaGo\\mediago\\bin\\win32\\x64\\gopeed.exe",
        MEDIAGO_SCHEMA_PATH: "F:\\Workspace\\Projects\\MediaGo\\mediago-core\\configs\\download_schemas.json",
      },
      host: this.host,
      port: this.port,
    });

    runner.start();

    // 1. 订阅 SSE 接收状态变更
    const eventSource = new EventSource(`http://localhost:${this.port}/api/events`);

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
      const interval = setInterval(async () => {
        const { data } = await axios.get(`http://localhost:${this.port}/api/tasks/`);

        if (data.tasks.length === 0) {
          return;
        }

        console.log(`进度: ${JSON.stringify(data)}`);
      }, 1000); // 每秒查询一次
    };

    startPolling();
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
