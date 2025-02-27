import EventEmitter from "events";
import { inject, injectable } from "inversify";
import {
  DownloadParams,
  DownloadProgress,
  DownloadStatus,
  Task,
} from "../interfaces.ts";
import { TYPES } from "../types.ts";
import Logger from "../vendor/Logger.ts";
import VideoRepository from "../repository/VideoRepository.ts";
import {
  Platform,
  biliDownloaderBin,
  m3u8DownloaderBin,
} from "../helper/index.ts";
import * as pty from "node-pty";
import stripAnsi from "strip-ansi";
import i18n from "../i18n/index.ts";
import ConfigService from "./ConfigService.ts";
import path from "path";

interface DownloadContext {
  // Whether it is live
  isLive: boolean;
  // Download progress
  percent: string;
  // Download speed
  speed: string;
  // Ready
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

// FIXME: Multilingual regular expressions
const processList: Schema[] = [
  {
    type: "m3u8",
    platform: [Platform.MacOS, Platform.Linux, Platform.Windows],
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
      headers: {
        argsName: ["--header"],
      },
      deleteSegments: {
        argsName: ["--del-after-done"],
      },
      proxy: {
        argsName: ["--custom-proxy"],
      },
      __common__: {
        argsName: [
          "--no-log",
          "--auto-select",
          "--ui-language",
          "zh-CN",
          "--live-real-time-merge",
          "--check-segments-count",
          "false",
        ],
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
    platform: [Platform.Linux, Platform.MacOS, Platform.Windows],
    bin: biliDownloaderBin,
    args: {
      url: {
        argsName: null,
      },
      localDir: {
        argsName: ["--work-dir"],
      },
      name: {
        argsName: ["--file-pattern"],
      },
    },
    consoleReg: {
      speed: "([\\d.]+\\s[GMK]B/s)",
      percent: "([\\d.]+)%",
      error: "ERROR",
      start: "开始下载",
      isLive: "检测到直播流",
    },
  },
];

@injectable()
export default class DownloadService extends EventEmitter {
  private queue: Task[] = [];

  private active: Task[] = [];

  private limit: number = 2;

  private signal: Record<number, AbortController> = {};

  constructor(
    @inject(TYPES.Logger)
    private readonly logger: Logger,
    @inject(TYPES.VideoRepository)
    private readonly videoRepository: VideoRepository,
    @inject(TYPES.ConfigService)
    private readonly storeService: ConfigService
  ) {
    super();

    // this.storeService.getConfig().then(({ maxRunner }) => {
    //   this.limit = maxRunner;
    // });
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
      await this.videoRepository.changeVideoStatus(
        task.id,
        DownloadStatus.Downloading
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

      const { proxy, downloadProxySwitch } =
        await this.storeService.getConfig();
      if (downloadProxySwitch && proxy) {
        params.proxy = proxy;
      }

      await this.process(params);
      delete this.signal[task.id];
      this.logger.info(`taskId: ${task.id} success`);

      await this.videoRepository.changeVideoStatus(
        task.id,
        DownloadStatus.Success
      );
      this.emit("download-success", task.id);
    } catch (err: any) {
      if (err.message === "AbortError") {
        this.logger.info(`taskId: ${task.id} stopped`);
        // Download pause
        await this.videoRepository.changeVideoStatus(
          task.id,
          DownloadStatus.Stopped
        );
        this.emit("download-stop", task.id);
      } else {
        this.logger.error(`taskId: ${task.id} failed`, err);
        // Download failure
        await this.videoRepository.changeVideoStatus(
          task.id,
          DownloadStatus.Failed
        );
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

  private _execa(
    binPath: string,
    args: string[],
    params: DownloadOptions
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
            const txt = stripAnsi(data);
            this.emit("download-message", id, data);
            onMessage(ctx, txt);
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
          reject(new Error(i18n.t("unknownError")));
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
      folder,
    } = params;

    const spawnParams = [];
    for (const key of Object.keys(schema.args)) {
      const { argsName } = schema.args[key];
      if (key === "url") {
        argsName && spawnParams.push(...argsName);
        spawnParams.push(url);
      }
      if (key === "localDir") {
        let finalLocal = local;
        if (folder) {
          finalLocal = path.join(local, folder);
        }
        argsName && argsName.forEach((i) => spawnParams.push(i, finalLocal));
      }
      if (key === "name") {
        argsName && argsName.forEach((i) => spawnParams.push(i, name));
      }

      if (key === "headers" && headers) {
        const headerArr: string[] = headers?.split("\n") || [];
        headerArr.forEach((headerStr) => {
          spawnParams.push("--header", headerStr);
        });
      }

      if (key === "deleteSegments" && deleteSegments) {
        argsName && spawnParams.push(...argsName);
      }

      if (key === "proxy" && proxy) {
        argsName && argsName.forEach((i) => spawnParams.push(i, proxy));
      }

      if (key === "__common__") {
        argsName && spawnParams.push(...argsName);
      }
    }

    const { consoleReg } = schema;
    const isLiveReg = RegExp(consoleReg.isLive, "g");
    const startDownloadReg = RegExp(consoleReg.start, "g");
    const errorReg = RegExp(consoleReg.error, "g");
    const speedReg = RegExp(consoleReg.speed, "g");
    const percentReg = RegExp(consoleReg.percent, "g");

    const onMessage = (ctx: DownloadContext, message: string) => {
      // Resolve whether it is a live resource
      if (isLiveReg.test(message)) {
        ctx.isLive = true;
      }
      // Parse download progress
      const [, percent] = percentReg.exec(message) || [];
      if (percent && Number(ctx.percent || 0) < Number(percent)) {
        ctx.percent = percent;
      }
      // Parsing download speed
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

    this.logger.debug("download params: ", spawnParams.join(" "));
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
      return Promise.reject(new Error(i18n.t("unsupportedDownloadType")));
    }

    const schema = program[0];
    await this.downloader(params, schema);
  }
}
