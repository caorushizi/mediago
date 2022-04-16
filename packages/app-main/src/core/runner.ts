import Downloader from "./downloader/downloader";
import { spawn, SpawnOptions } from "child_process";
import { workspace } from "../utils/variables";
import { argsBuilder } from "../utils";
import logger from "../core/logger";

// runner
class Runner {
  private static instance: Runner;

  private constructor(private downloader?: Downloader) {}

  static getInstance(): Runner {
    if (!Runner.instance) {
      Runner.instance = new Runner();
    }
    return Runner.instance;
  }

  setDownloader(downloader: Downloader): void {
    this.downloader = downloader;
  }

  run(options: SpawnOptions): Promise<void> {
    const command = this.downloader?.getBin();
    const args = this.downloader?.getArgs();

    if (!command || !args) throw new Error("请先初始化downloader");
    logger.info("下载参数：", options.cwd, command, args);

    return new Promise((resolve, reject) => {
      const spawnCommand = spawn(command, argsBuilder(args), {
        cwd: workspace,
        detached: true,
        shell: true,
        ...options,
      });

      spawnCommand.stdout?.on("data", (data) => {
        const value = data.toString().trim();
        console.log(`stdout: ${value}`);
      });

      spawnCommand.stderr?.on("data", (data) => {
        const value = data.toString().trim();
        console.error(`stderr: ${value}`);
      });

      spawnCommand.on("close", (code) => {
        if (code !== 0) reject(new Error(`调用 ${command} 可执行文件执行失败`));
        else resolve();
      });

      spawnCommand.on("error", (err) => {
        console.error(`err: ${err}`);
      });
    });
  }
}

export default Runner;
