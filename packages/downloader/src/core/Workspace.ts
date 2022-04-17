import path from "path";
import { ensureDir, pathExists, writeFile } from "fs-extra";
import { concatVideo, parseManifest } from "../utils";
import { Task } from "./Task";
import Downloader from "./Downloader";
import { AxiosProxyConfig, AxiosRequestHeaders } from "axios";
import { TaskRunner } from "./TaskRunner";
import { CipherGCMTypes, createDecipheriv } from "crypto";
import cache from "./Cache";

export default class Workspace {
  m3u8Path: string;
  fileList: string;
  cacheDir: string;
  videoPath: string;
  manifest?: Manifest;
  segments?: Segment[];

  runner: TaskRunner;
  downloader: Downloader;

  constructor(
    private m3u8Url: string,
    private baseDir: string,
    private videoName: string,
    proxy?: AxiosProxyConfig,
    headers?: AxiosRequestHeaders
  ) {
    const cacheDir = path.resolve(baseDir, videoName);
    this.m3u8Path = path.resolve(cacheDir, "raw.m3u8");
    this.fileList = path.resolve(cacheDir, "fileList.txt");
    this.cacheDir = cacheDir;
    this.videoPath = path.resolve(baseDir, `${videoName}.mp4`);

    this.runner = new TaskRunner({
      limit: 15,
      debug: true,
    });
    this.downloader = new Downloader(proxy);
  }

  async prepare(): Promise<void> {
    if (await pathExists(this.videoPath)) {
      throw new Error("视频文件已经存在");
    }

    await ensureDir(this.cacheDir);

    await this.prepareSegments();

    await this.prepareSegmentTasks();
  }

  private async prepareSegments() {
    const data = await this.downloader.fetch(this.m3u8Url);
    this.manifest = await parseManifest(String(data));

    const { playlists } = this.manifest || {};
    if (playlists && playlists.length > 0) {
      // todo: 选择 playlist
      const [playlist] = playlists;
      const url = Downloader.buildUrl(playlist.uri, this.m3u8Url);

      const data = await this.downloader.fetch(url);
      this.manifest = await parseManifest(String(data));
    }

    this.segments = this.manifest.segments;
  }

  private async prepareSegmentTasks(): Promise<void> {
    let fileListContent = "";

    if (!this.segments) {
      return;
    }

    for (const [index, item] of Object.entries(this.segments)) {
      const dest = path.resolve(this.cacheDir, `${index}.ts`);
      fileListContent += `file '${dest}'\n`;

      const sign = item?.key?.uri;
      if (item.key) {
        if (!cache.has(sign)) {
          const keyUrl = Downloader.buildUrl(item.key.uri, this.m3u8Url);
          const key = await this.downloader.fetch(keyUrl);
          cache.set(sign, key);
        }
      }

      const task = new Task(async () => {
        const url = Downloader.buildUrl(item.uri, this.m3u8Url);

        const transforms = [];
        if (cache.has(sign)) {
          const method = `${item.key.method}-cbc`.toLowerCase() as CipherGCMTypes;
          const iv = item.key.iv;
          const key = cache.get(sign) as string;
          const transform = createDecipheriv(method, key, iv);
          transforms.push(transform);
        }

        await this.downloader.do(url, dest, transforms);
      });
      this.runner.addTask(task);
    }

    await writeFile(this.fileList, fileListContent);
  }

  async run(): Promise<void> {
    this.runner.run();

    return new Promise((resolve) => {
      this.runner.on("done", async () => {
        await concatVideo(this.fileList, this.videoPath);

        resolve();
      });
    });
  }
}
