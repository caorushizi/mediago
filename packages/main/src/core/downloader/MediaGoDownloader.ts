import { Downloader } from "./index";

export class MediaGoDownloader extends Downloader {
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
