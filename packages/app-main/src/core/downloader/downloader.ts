import Runner from "../runner";

class Downloader {
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

export default Downloader;
