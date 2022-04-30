import Runner from "./runner";
import glob from "glob";
import { binDir } from "../utils/variables";
import semver from "semver";
import { pathExists } from "fs-extra";
import path from "path";

export class Downloader {
  protected bin = ""; // 可执行文件地址
  protected args = ""; // runner 参数

  constructor(public type: string) {}

  handle(runner: Runner): void {
    runner.setDownloader(this);
  }

  async parseArgs(args: Record<string, string>): Promise<void> {
    // empty
  }

  getBin(): string {
    return this.bin;
  }

  getArgs(): string {
    return this.args;
  }
}

// mediago 下载器
class MediaGoDownloader extends Downloader {
  constructor() {
    super("mediago");

    this.bin = process.platform === "win32" ? "mediago" : "./mediago";
  }

  async parseArgs(args: Record<string, string>): Promise<void> {
    this.args = Object.entries(args)
      .reduce((prev: string[], [key, value]) => {
        if (value) prev.push(`-${key} "${value}"`);
        return prev;
      }, [])
      .join(" ");
  }
}

// N_m3u8DL-CLI 下载器
class NM3u8DlCliDownloader extends Downloader {
  constructor() {
    super("N_m3u8DL-CLI");

    const binNameList = glob.sync("N_m3u8DL-CLI*.exe", {
      cwd: binDir,
    });
    const [version] = binNameList
      .map((item) => /N_m3u8DL-CLI_v(.*).exe/.exec(item)?.[1] || "0.0.0")
      .filter((item) => semver.valid(item))
      .sort((a, b) => (semver.gt(a, b) ? -1 : 1));
    if (!version) throw new Error("没有找到 N_m3u8DL-CLI");
    this.bin = `N_m3u8DL-CLI_v${version}`;
    if (process.platform === "win32") {
      this.bin = `${this.bin}.exe`;
    }
  }

  async parseArgs(args: Record<string, string>): Promise<void> {
    const binExist = await pathExists(path.resolve(binDir, this.bin));
    if (!binExist) throw new Error("没有找到 N_m3u8DL-CLI");

    const argsStr = Object.entries(args)
      .reduce((prev: string[], [key, value]) => {
        if (key === "url") return prev;
        if (value && typeof value === "boolean") prev.push(`--${key}`);
        if (value && (typeof value === "string" || typeof value === "number"))
          prev.push(`--${key} "${value}"`);
        return prev;
      }, [])
      .join(" ");
    this.args = `"${args.url}" ${argsStr}`;
  }
}

const createDownloader = (type: string): Downloader => {
  if (type === "mediago") {
    return new MediaGoDownloader();
  }
  if (type === "N_m3u8DL-CLI") {
    return new NM3u8DlCliDownloader();
  }
  throw new Error("暂不支持该下载方式");
};

export { createDownloader };
