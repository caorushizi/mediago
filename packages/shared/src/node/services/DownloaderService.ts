import { injectable } from "inversify";
import { ptyRunner } from "@mediago/shared/node";
import { DownloadType, getFileExtension } from "../../common/index.ts";
import path from "path";
import { DownloadParams, DownloadContext } from "@mediago/shared/common";
import { DownloadSchema } from "../types/index.ts";

@injectable()
export default class DownloaderService {
  private binMap?: Record<DownloadType, string>;

  constructor() {}

  public init(binMap: Record<DownloadType, string>) {
    this.binMap = binMap;
  }

  async download(
    params: DownloadParams,
    schema: DownloadSchema
  ): Promise<void> {
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
        argsName &&
          argsName.forEach((i) => spawnParams.push(i, String(deleteSegments)));
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
        callback("progress", {
          id,
          type: "progress",
          percent: ctx.percent || "",
          speed: ctx.speed || "",
          isLive: ctx.isLive,
        });
      }
    };

    if (!this.binMap) {
      throw new Error("binMap is not initialized");
    }

    const binPath = this.binMap[params.type];

    // TODO: logger
    await ptyRunner({
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
  }
}
