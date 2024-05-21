import EventEmitter from "events";
import { inject, injectable } from "inversify";
import {
  DownloadParams,
  DownloadProgress,
  DownloadStatus,
  Task,
} from "../interfaces";
import { TYPES } from "../types";
import ElectronLogger from "../vendor/ElectronLogger";
import ElectronStore from "../vendor/ElectronStore";
import VideoRepository from "../repository/VideoRepository";
import { biliDownloaderBin, m3u8DownloaderBin } from "../helper";
import * as pty from "node-pty";
import stripAnsi from "strip-ansi";

interface DownloadContext {
  // 是否为直播
  isLive: boolean;
  // 下载进度
  percent: string;
  // 下载速度
  speed: string;
  // 是否已经 ready
  ready: boolean;
}

export interface DownloadOptions {
  abortSignal: AbortController;
  encoding?: string;
  onMessage?: (ctx: DownloadContext, message: string) => void;
  id: number;
}

interface Schema {
  args: Record<string, { argsName: string[] | null }>;
  consoleReg: {
    percent: string;
    speed: string;
    error: string;
    start: string;
    isLive: string;
  };
  bin: string;
  platform: string[];
  type: string;
}

const processList: Schema[] = [
  {
    type: "m3u8",
    platform: ["win32"],
    bin: m3u8DownloaderBin,
    args: {
      url: {
        argsName: null,
      },
      localDir: {
        argsName: ["--workDir"],
      },
      name: {
        argsName: ["--saveName"],
      },
      // headers: {
      //   argsName: ["--headers"],
      // },
      deleteSegments: {
        argsName: ["--enableDelAfterDone"],
      },
      proxy: {
        argsName: ["--proxyAddress"],
      },
    },
    consoleReg: {
      percent: "([\\d.]+)%",
      speed: "([\\d.]+\\s[GMK]B/s)",
      error: "ERROR",
      start: "开始下载文件|开始录制",
      isLive: "识别为直播流, 开始录制",
    },
  },
  {
    type: "m3u8",
    platform: ["darwin"],
    bin: m3u8DownloaderBin,
    args: {
      url: {
        argsName: null,
      },
      localDir: {
        argsName: ["--tmp-dir", "--save-dir"],
      },
      name: {
        argsName: ["--save-name"],
      },
      // headers: {
      //   argsName: ["--headers"],
      // },
      deleteSegments: {
        argsName: ["--del-after-done"],
      },
      proxy: {
        argsName: ["--custom-proxy"],
      },
    },
    consoleReg: {
      percent: "([\\d.]+)%",
      speed: "([\\d.]+[GMK]Bps)",
      error: "ERROR",
      start: "保存文件名:",
      isLive: "检测到直播流",
    },
  },
  {
    type: "bilibili",
    platform: ["win32", "darwin"],
    bin: biliDownloaderBin,
    args: {
      url: {
        argsName: null,
      },
      localDir: {
        argsName: ["--work-dir"],
      },
    },
    consoleReg: {
      speed: "([\\d.]+\\s[GMK]B/s)",
      percent: "([\\d.]+)%",
      error: "ERROR",
      start: "保存文件名:",
      isLive: "检测到直播流",
    },
  },
];

@injectable()
export default class DownloadService extends EventEmitter {
  private queue: Task[] = [];

  private active: Task[] = [];

  private limit: number;

  private signal: Record<number, AbortController> = {};

  constructor(
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.ElectronStore)
    private readonly storeService: ElectronStore,
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
      this.logger.info(`taskId: ${id} stop`);
      this.signal[id].abort();
    }
  }

  async execute(task: Task) {
    try {
      await this.videoRepository.changeVideoStatus(
        task.id,
        DownloadStatus.Downloading,
      );
      this.emit("download-start", task.id);

      this.logger.info(`taskId: ${task.id} start`);
      const controller = new AbortController();
      this.signal[task.id] = controller;

      const callback = (progress: DownloadProgress) => {
        if (progress.type === "progress") {
          this.emit("download-progress", progress);
        } else if (progress.type === "ready") {
          this.emit("download-ready-start", progress);
          if (progress.isLive) {
            this.removeTask(progress.id);
          }
        }
      };

      const params: DownloadParams = {
        ...task.params,
        id: task.id,
        abortSignal: controller,
        callback,
      };

      const { proxy, useProxy } = this.storeService.store;
      if (useProxy) {
        params.proxy = proxy;
      }

      await this.process(params);
      delete this.signal[task.id];
      this.logger.info(`taskId: ${task.id} success`);

      await this.videoRepository.changeVideoStatus(
        task.id,
        DownloadStatus.Success,
      );
      this.emit("download-success", task.id);
    } catch (err: any) {
      this.logger.info(`taskId: ${task.id} failed`);
      if (err.message === "AbortError") {
        // 下载暂停
        await this.videoRepository.changeVideoStatus(
          task.id,
          DownloadStatus.Stopped,
        );
        this.emit("download-stop", task.id);
      } else {
        // 下载失败
        await this.videoRepository.changeVideoStatus(
          task.id,
          DownloadStatus.Failed,
        );
        this.emit("download-failed", task.id, err);
      }
    } finally {
      this.removeTask(task.id);

      // 传输完成
      if (this.queue.length === 0 && this.active.length === 0) {
        // this.emit("download-finish");
      }
    }
  }

  removeTask(id: number) {
    // 处理当前正在活动的任务
    const doneId = this.active.findIndex((i) => i.id === id);
    this.active.splice(doneId, 1);
    // 处理完成的任务
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

  private _execa(
    binPath: string,
    args: string[],
    params: DownloadOptions,
  ): Promise<void> {
    const { abortSignal, onMessage, id } = params;

    return new Promise((resolve, reject) => {
      const ptyProcess = pty.spawn(binPath, args, {
        name: "xterm-color",
        cols: 500,
        rows: 500,
        useConpty: false,
      });

      if (onMessage) {
        const ctx: DownloadContext = {
          ready: false,
          isLive: false,
          percent: "",
          speed: "",
        };
        ptyProcess.onData((data) => {
          try {
            this.emit("download-message", id, data);
            onMessage(ctx, stripAnsi(data));
          } catch (err) {
            reject(err);
          }
        });
      }

      abortSignal.signal.addEventListener("abort", () => {
        ptyProcess.kill();
        reject(new Error("AbortError"));
      });

      ptyProcess.onExit(({ exitCode }) => {
        if (exitCode === 0) {
          resolve();
        } else {
          reject(new Error("未知错误"));
        }
      });
    });
  }

  async downloader(params: DownloadParams, schema: Schema): Promise<void> {
    const {
      id,
      abortSignal,
      url,
      local,
      name,
      deleteSegments,
      headers,
      callback,
      proxy,
    } = params;

    const spawnParams = [];
    for (const key of Object.keys(schema.args)) {
      const { argsName } = schema.args[key];
      if (key === "url") {
        argsName && spawnParams.push(...argsName);
        spawnParams.push(url);
      }
      if (key === "localDir") {
        argsName && argsName.forEach((i) => spawnParams.push(i, local));
      }
      if (key === "name") {
        argsName && argsName.forEach((i) => spawnParams.push(i, name));
      }

      if (key === "headers") {
        if (headers) {
          const h: Record<string, unknown> = JSON.parse(headers);
          Object.entries(h).forEach(([k, v]) => {
            spawnParams.push("--header", `${k}: ${v}`);
          });
        }
      }

      if (key === "deleteSegments" && deleteSegments) {
        argsName && spawnParams.push(...argsName);
      }

      if (key === "proxy" && proxy) {
        argsName && argsName.forEach((i) => spawnParams.push(i, proxy));
      }
    }

    const { consoleReg } = schema;
    const isLiveReg = RegExp(consoleReg.isLive, "g");
    const startDownloadReg = RegExp(consoleReg.start, "g");
    const errorReg = RegExp(consoleReg.error, "g");
    const speedReg = RegExp(consoleReg.speed, "g");
    const percentReg = RegExp(consoleReg.percent, "g");

    const onMessage = (ctx: DownloadContext, message: string) => {
      // 解析是否为直播资源
      if (isLiveReg.test(message)) {
        ctx.isLive = true;
      }
      // 解析下载进度
      const [, percent] = percentReg.exec(message) || [];
      if (percent && Number(ctx.percent || 0) < Number(percent)) {
        ctx.percent = percent;
      }
      // 解析下载速度
      const [, speed] = speedReg.exec(message) || [];
      if (speed) {
        ctx.speed = speed;
      }

      if (startDownloadReg.test(message)) {
        callback({
          id,
          type: "ready",
          isLive: ctx.isLive,
          speed: "",
          percent: "",
        });
        ctx.ready = true;
        return;
      }

      if (errorReg.test(message)) {
        throw new Error(message);
      }

      if (ctx.ready && (ctx.percent || ctx.speed)) {
        callback({
          id,
          type: "progress",
          percent: ctx.percent || "",
          speed: ctx.speed || "",
          isLive: ctx.isLive,
        });
      }
    };

    this.logger.debug("download params: ", spawnParams);
    await this._execa(schema.bin, spawnParams, {
      id,
      abortSignal,
      onMessage,
    });
  }

  async process(params: DownloadParams): Promise<void> {
    const program = processList
      .filter((i) => i.platform.includes(process.platform))
      .filter((i) => i.type === params.type);

    if (program.length === 0) {
      return Promise.reject(new Error("不支持的下载类型"));
    }

    const schema = program[0];
    await this.downloader(params, schema);
  }
}
