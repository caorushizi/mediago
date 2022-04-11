import Downloader from "./downloader";

// mediago 下载器
class MediagoDownloader extends Downloader {
  constructor() {
    super("mediago");

    this.bin = process.platform === "win32" ? "mediago" : "./mediago";
  }

  parseArgs(args: Record<string, string>): void {
    this.args = Object.entries(args)
      .reduce((prev: string[], [key, value]) => {
        if (value) prev.push(`-${key} "${value}"`);
        return prev;
      }, [])
      .join(" ");
  }
}

export default MediagoDownloader;
