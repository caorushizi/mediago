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

export async function downloader(opts: DownloaderOptions): Promise<void> {
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
}
