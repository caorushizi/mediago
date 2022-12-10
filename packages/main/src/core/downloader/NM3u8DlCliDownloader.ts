import glob from "glob";
import semver from "semver";
import { pathExists } from "fs-extra";
import path from "path";
import { Downloader } from "./index";
import { binDir } from "../../utils/variables";

export class NM3u8DlCliDownloader extends Downloader {
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
