import { Parser } from "m3u8-parser";
import { Task, TaskRunner } from "./utils/Task";
import path from "path";
import { isUrl, spawnRunner } from "./utils";
import { downloader } from "./downloader";
import { nanoid } from "nanoid";
import { ensureDir, readFile, writeFile } from "fs-extra";

const prefix = "https://ukzy.ukubf3.com/";

interface OutputMeta {
  cwd: string;
  name: string;
  url: string;
}

interface DownloaderOptions {
  url: string;
  name?: string;
  path?: string;
}

async function start(opts: DownloaderOptions) {
  let { name, path: pathStr } = opts;
  const { url } = opts;
  if (!name) name = nanoid(5);
  if (!pathStr) pathStr = `${__dirname}/videos`;

  if (!isUrl(url)) {
    console.error("url 不是合法的url");
    return;
  }

  await run({
    name,
    path: pathStr,
    url,
  });
}

interface CertainOptions {
  url: string;
  name: string;
  path: string;
}
async function run(opts: CertainOptions) {
  const { path: pathStr, url, name } = opts;
  const videoDir = path.resolve(pathStr, name);
  await ensureDir(videoDir);

  const rawM3u8 = path.resolve(videoDir, "raw.m3u8");
  // await downloader(url, rawM3u8);
  const content = await readFile(rawM3u8);

  const parser = new Parser();
  parser.push(String(content));
  parser.end();

  const segments = (parser.manifest as Manifest).segments;

  const runner = new TaskRunner({
    limit: 15,
    debug: true,
  });

  const metaList = segments.map<OutputMeta>((item, index) => {
    return {
      name: `${String(index).padStart(5, "0")}.ts`,
      url: new URL(item.uri, prefix).toString(),
      cwd: videoDir,
    };
  });

  metaList.forEach((item) => {
    const dest = path.resolve(item.cwd, item.name);
    const task = new Task(() => downloader(item.url, dest));
    runner.addTask(task);
  });

  runner.run();

  runner.on("done", async () => {
    const filelist = metaList
      .map((item) => `file '${path.resolve(item.cwd, item.name)}'\n`)
      .join("");
    const filelistPath = path.resolve(videoDir, "filelist.txt");
    await writeFile(filelistPath, filelist);
    const outputPath = path.resolve(pathStr, `${name}.mp4`);
    const args = `-f concat -safe 0 -i "${filelistPath}" -acodec copy -vcodec copy "${outputPath}"`;
    console.log("args: ", args);

    await spawnRunner("ffmpeg", args, { removequotes: "always" });

    process.exit(0);
  });
}

/**
 *
 */
start({
  url: "https://ukzy.ukubf3.com/20220403/vYigLW9d/2000kb/hls/index.m3u8",
  path: "C:\\Users\\caorushizi\\Desktop\\test-desktop",
  name: "斗罗大陆 1",
});
