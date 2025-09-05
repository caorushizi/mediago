import EventEmitter from "node:events";
import { provide } from "@inversifyjs/binding-decorators";
import { DownloadType } from "@mediago/shared-common";
import { type OnSendHeadersListenerDetails, session } from "electron";
import { inject, injectable } from "inversify";
import { formatHeaders, PERSIST_WEBVIEW, PRIVACY_WEBVIEW, urlCache } from "../helper/index";
import ElectronLogger from "../vendor/ElectronLogger";

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
    // TODO: Collections, lists, favorites
    hosts: [/^https?:\/\/(www\.)?bilibili.com\/video/],
    type: DownloadType.bilibili,
    schema: {
      name: "title",
    },
  },
  {
    matches: [/\.(mp4|flv|mov|avi|mkv|wmv|webm|mp3|m4a|aac|wav|ogg|m4b|m4p|m4r|m4b|m4p|m4r)/],
    type: DownloadType.direct,
  },
];

@injectable()
@provide()
export class SniffingHelper extends EventEmitter {
  private pageInfo: PageInfo = { title: "", url: "" };
  private readonly prepareDelay = 1000;

  constructor(
    @inject(ElectronLogger)
    private readonly logger: ElectronLogger,
  ) {
    super();
  }

  pluginReady() {
    // empty
  }

  update(pageInfo: PageInfo) {
    this.pageInfo = pageInfo;
  }

  checkPageInfo() {
    // Send page related information
    const sendPageInfo = () => {
      listLoop: for (const filter of filterList) {
        if (filter.hosts) {
          for (const host of filter.hosts) {
            if (!host.test(this.pageInfo.url)) {
              continue;
            }

            this.send({
              url: this.pageInfo.url,
              documentURL: this.pageInfo.url,
              name: this.pageInfo.title,
              type: filter.type,
            });
            break listLoop;
          }
        }
      }
    };

    setTimeout(() => {
      sendPageInfo();
    }, this.prepareDelay);
  }

  start(privacy: boolean = false) {
    const partition = privacy ? PRIVACY_WEBVIEW : PERSIST_WEBVIEW;
    const viewSession = session.fromPartition(partition);
    viewSession.webRequest.onSendHeaders(this.onSendHeaders);
  }

  send = (item: SourceParams) => {
    const urlCacheKey = `${item.url}_${item.name}`;
    const cacheUrl = urlCache.get(urlCacheKey);
    if (cacheUrl) {
      return;
    }

    this.logger.info(`[SniffingHelper] send: ${item.url}`);
    this.emit("source", item);

    urlCache.set(urlCacheKey, true);
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
