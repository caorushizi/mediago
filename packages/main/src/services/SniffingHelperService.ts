import { inject, injectable } from "inversify";
import { DownloadType } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import ElectronLogger from "../vendor/ElectronLogger.ts";
import EventEmitter from "events";
import { OnSendHeadersListenerDetails, session } from "electron";
import {
  PERSIST_WEBVIEW,
  PRIVACY_WEBVIEW,
  formatHeaders,
} from "../helper/index.ts";

export interface SourceParams {
  url: string;
  documentURL: string;
  name: string;
  type: DownloadType;
  headers?: string;
}

export interface SourceFilter {
  hosts?: RegExp[];
  matches?: RegExp[];
  type: DownloadType;
  schema?: Record<string, string>;
}

interface PageInfo {
  title: string;
  url: string;
}

const filterList: SourceFilter[] = [
  {
    matches: [/\.m3u8/],
    type: DownloadType.m3u8,
  },
  {
    // TODO: 合集、列表、收藏夹
    hosts: [/^https?:\/\/(www\.)?bilibili.com\/video/],
    type: DownloadType.bilibili,
    schema: {
      name: "title",
    },
  },
];

@injectable()
export class SniffingHelper extends EventEmitter {
  private pageInfo: PageInfo = { title: "", url: "" };
  private ready = false;
  private queue: SourceParams[] = [];

  constructor(
    @inject(TYPES.ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {
    super();
  }

  pluginReady() {
    this.ready = true;
    this.queue.forEach((item) => {
      this.emit("source", item);
    });
  }

  update(pageInfo: PageInfo) {
    this.pageInfo = pageInfo;
  }

  reset(pageInfo: PageInfo) {
    this.pageInfo = pageInfo;
    this.ready = false;
    this.queue = [];

    listLoop: for (const filter of filterList) {
      if (filter.hosts) {
        for (const host of filter.hosts) {
          if (!host.test(pageInfo.url)) {
            continue;
          }

          this.send({
            url: pageInfo.url,
            documentURL: pageInfo.url,
            name: pageInfo.title,
            type: filter.type,
          });
          break listLoop;
        }
      }
    }
  }

  start(privacy: boolean = false) {
    const partition = privacy ? PRIVACY_WEBVIEW : PERSIST_WEBVIEW;
    const viewSession = session.fromPartition(partition);
    viewSession.webRequest.onSendHeaders(this.onSendHeaders);
  }

  send = (item: SourceParams) => {
    this.logger.info(`在窗口中捕获视频链接: ${item.url}`);
    // 等待 DOM 中浮窗加载完成
    // if (this.ready) {
    // } else {
    //   this.queue.push(item);
    // }
    this.emit("source", item);
  };

  private onSendHeaders = (details: OnSendHeadersListenerDetails): void => {
    const { url, requestHeaders } = details;
    const { title, url: documentURL } = this.pageInfo;

    listLoop: for (const filter of filterList) {
      if (filter.matches) {
        for (const match of filter.matches) {
          const u = new URL(url);
          if (!match.test(u.pathname)) {
            continue;
          }

          this.send({
            url,
            documentURL,
            name: title,
            type: filter.type,
            headers: formatHeaders(requestHeaders),
          });
          break listLoop;
        }
      }
    }
  };
}
