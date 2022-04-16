import { spawn } from "child_process";
import argsBuilder from "./args-builder";

export async function spawnRunner(
  command: string,
  args: string,
  opts?: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    const spawnCommand = spawn("ffmpeg", argsBuilder(args, opts));

    spawnCommand.stdout?.on("data", (data) => {
      const value = data.toString().trim();
      console.log(`stdout: ${value}`);
    });

    spawnCommand.stderr?.on("data", (data) => {
      const value = data.toString().trim();
      console.error(`stderr: ${value}`);
    });

    spawnCommand.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("执行失败"));
      } else {
        resolve();
      }
    });
  });
}

export function isUrl(urlStr: string): boolean {
  return /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/.test(urlStr);
}
