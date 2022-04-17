import { isUrl } from "./utils";
import { nanoid } from "nanoid";
import Workspace from "./core/Workspace";
import { AxiosProxyConfig, AxiosRequestHeaders } from "axios";

interface DownloaderOptions {
  url: string;
  name?: string;
  path?: string;
  proxy?: AxiosProxyConfig;
  headers?: AxiosRequestHeaders;
}

async function run(opts: DownloaderOptions) {
  let { name, path: pathStr } = opts;
  const { url, proxy, headers } = opts;
  if (!name) name = nanoid(5);
  if (!pathStr) pathStr = `${__dirname}/videos`;

  if (!isUrl(url)) {
    console.error("url 不是合法的url");
    return;
  }

  const workspace = new Workspace(url, pathStr, name, proxy, headers);
  await workspace.prepare();

  await workspace.run();

  process.exit(0);
}

const params = {
  url: "https://ukzy.ukubf3.com/20220409/WtaJj2Hy/index.m3u8",
  path: "C:\\Users\\caorushizi\\Desktop\\test-desktop",
  name: "斗罗大陆 1",
};

run(params);
