import axios, { AxiosProxyConfig } from "axios";
import { Agent } from "https";
import { move, pathExists, createWriteStream } from "fs-extra";

const httpReg = /^https?:\/\//;
const isAbsReg = /^\//;

export default class Downloader {
  constructor(private proxy?: AxiosProxyConfig) {}

  static buildUrl(uri: string, baseUrl: string): string {
    let url: string;
    if (httpReg.test(uri)) {
      url = uri;
    } else {
      const m3u8 = new URL(baseUrl);
      if (isAbsReg.test(uri)) {
        m3u8.pathname = uri;
      } else {
        const pathArr = m3u8.pathname.split("/");
        pathArr.pop();
        pathArr.push(uri);
        m3u8.pathname = pathArr.join("/");
      }
      url = m3u8.toString();
    }

    return url;
  }

  async fetch(url: string): Promise<Buffer> {
    const resp = await axios.get(url, {
      httpsAgent: new Agent({
        rejectUnauthorized: false,
      }),
      proxy: this.proxy,
      responseType: "arraybuffer",
    });

    return resp.data;
  }

  async do(url: string, output: string, transforms: any[]): Promise<void> {
    const exist = await pathExists(output);
    if (exist) return;

    const tmpFile = `${output}.tmp`;

    const writer = createWriteStream(tmpFile);
    const resp = await axios.get(url, {
      httpsAgent: new Agent({
        rejectUnauthorized: false,
      }),
      responseType: "stream",
      proxy: this.proxy,
    });

    let pipeline = resp.data;
    transforms.forEach((t) => {
      pipeline = pipeline.pipe(t);
    });
    pipeline.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", async () => {
        await move(tmpFile, output);
        resolve();
      });
      writer.on("error", reject);
    });
  }
}
