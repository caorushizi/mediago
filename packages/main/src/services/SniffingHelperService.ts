import { inject, injectable } from "inversify";
import { DownloadType } from "../interfaces";
import { TYPES } from "../types";
import ElectronLogger from "../vendor/ElectronLogger";
import EventEmitter from "events";
import { session } from "electron";
import { PERSIST_WEBVIEW } from "../helper";
import {
  CallbackResponse,
  OnBeforeRequestListenerDetails,
} from "electron/main";

export interface SourceParams {
  id: number;
  url: string;
  filter: SourceFilter;
  documentURL: string;
  name: string;
  type: DownloadType;
}

export interface SourceFilter {
  matches: RegExp[];
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
    matches: [/^https?:\/\/(www\.)?bilibili.com\/video/],
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

  reset(pageInfo: PageInfo) {
    this.pageInfo = pageInfo;
    this.ready = false;
    this.queue = [];
  }

  start() {
    const viewSession = session.fromPartition(PERSIST_WEBVIEW);
    viewSession.webRequest.onBeforeRequest(this.requestWillBeSent.bind(this));
  }

  private requestWillBeSent(
    details: OnBeforeRequestListenerDetails,
    callback: (response: CallbackResponse) => void,
  ): void {
    const { id, webContents, url } = details;
    const { title } = this.pageInfo;

    const documentURL = webContents?.getURL() || "";

    for (const filter of filterList) {
      for (const match of filter.matches) {
        const u = new URL(url);
        if (!match.test(u.pathname)) {
          continue;
        }

        const item: SourceParams = {
          id,
          url,
          filter,
          documentURL,
          name: title,
          type: filter.type,
        };

        this.logger.info(`在窗口中捕获视频链接: ${url}`);
        // 等待 DOM 中浮窗加载完成
        if (this.ready) {
          this.emit("source", item);
        } else {
          this.queue.push(item);
        }

        return;
      }
    }

    callback({});
  }
}
