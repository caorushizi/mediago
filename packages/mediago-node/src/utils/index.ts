import { spawn } from "child_process";
import argsBuilder from "spawn-args";
import { Parser } from "m3u8-parser";

export async function spawnRunner(
  command: string,
  args: string,
  opts?: unknown
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

export async function concatVideo(
  filelist: string,
  video: string
): Promise<void> {
  const args = `-f concat -safe 0 -i "${filelist}" -acodec copy -vcodec copy "${video}"`;
  await spawnRunner("ffmpeg", args, { removequotes: "always" });
}

export async function parseManifest(rawM3u8: string): Promise<Manifest> {
  const parser = new Parser();
  parser.push(rawM3u8);
  parser.end();

  return parser.manifest as Manifest;
}

export async function sleep(duration = 0): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}
