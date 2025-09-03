import type { DownloadContext, DownloadParams } from "@mediago/shared/common";
import type { ptyRunner } from "@mediago/shared/node";
import { injectable } from "inversify";
import path from "path";
import { type DownloadType, getFileExtension } from "../../common/index";
import type { DownloadSchema } from "../types/index";

@injectable()
export default class DownloaderService {
  private binMap?: Record<DownloadType, string>;
  private runner?: any;
  private lastProgressUpdate = new Map<number, { percent: string; speed: string; timestamp: number }>();
  private readonly PROGRESS_THROTTLE_MS = 200; // 200ms 进度更新节流
  private readonly MIN_PROGRESS_DIFF = 0.5; // 最小进度差异 0.5%

  constructor() {}

  public init(binMap: Record<DownloadType, string>, runner: typeof ptyRunner) {
    this.binMap = binMap;
    this.runner = runner;
  }

  async download(params: DownloadParams, schema: DownloadSchema): Promise<void> {
    const {
      id,
      abortSignal: abortController,
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
      const { argsName, postfix } = schema.args[key];
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
        let finalName = name;
        if (postfix) {
          if (postfix === "@@AUTO@@") {
            const extension = getFileExtension(url);
            finalName = `${name}.${extension}`;
          } else {
            finalName = `${name}${postfix}`;
          }
        }
        argsName && argsName.forEach((i) => spawnParams.push(i, finalName));
      }

      if (key === "headers" && headers) {
        const h: string[] = headers?.split("\n") || [];
        h.forEach((str) => {
          spawnParams.push("--header", str);
        });
      }

      if (key === "deleteSegments") {
        argsName && argsName.forEach((i) => spawnParams.push(i, String(deleteSegments)));
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

    // 智能进度更新检查
    const shouldUpdateProgress = (id: number, newPercent: string, newSpeed: string): boolean => {
      const now = Date.now();
      const lastUpdate = this.lastProgressUpdate.get(id);

      if (!lastUpdate) {
        return true; // 首次更新
      }

      // 时间节流检查
      if (now - lastUpdate.timestamp < this.PROGRESS_THROTTLE_MS) {
        return false;
      }

      // 进度差异检查
      const percentDiff = Math.abs(Number(newPercent) - Number(lastUpdate.percent));
      if (percentDiff < this.MIN_PROGRESS_DIFF && newSpeed === lastUpdate.speed) {
        return false;
      }

      return true;
    };

    const onMessage = (ctx: DownloadContext, message: string) => {
      callback("message", { id, message });

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
        callback("progress", {
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
        const currentPercent = ctx.percent || "";
        const currentSpeed = ctx.speed || "";

        // 智能节流：只有在满足更新条件时才发送进度更新
        if (shouldUpdateProgress(id, currentPercent, currentSpeed)) {
          callback("progress", {
            id,
            type: "progress",
            percent: currentPercent,
            speed: currentSpeed,
            isLive: ctx.isLive,
          });

          // 更新最后进度记录
          this.lastProgressUpdate.set(id, {
            percent: currentPercent,
            speed: currentSpeed,
            timestamp: Date.now(),
          });
        }
      }
    };

    if (!this.binMap) {
      throw new Error("binMap is not initialized");
    }

    const binPath = this.binMap[params.type];

    try {
      // TODO: logger
      await this.runner?.({
        abortController,
        onMessage,
        binPath,
        args: spawnParams,
        ctx: {
          ready: false,
          isLive: false,
          percent: "",
          speed: "",
        },
      });
    } finally {
      // 清理进度追踪记录
      this.lastProgressUpdate.delete(id);
    }
  }
}
