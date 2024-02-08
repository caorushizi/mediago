import { inject, injectable } from "inversify";
import { DownloadType } from "../interfaces";
import { WebSource } from "../main";
import { TYPES } from "../types";
import LoggerService from "../services/LoggerService";
import StoreService from "../services/StoreService";
import { load } from "cheerio";
import EventEmitter from "events";

interface SourceParams {
  url: string;
  requestId: string;
  headers: Record<string, any>;
  filter: SourceFilter;
  documentURL: string;
  body: string;
}

interface SourceFilter {
  matches: RegExp[];
  type: DownloadType;
  handler: (this: SniffingHelper, params: SourceParams) => Promise<WebSource>;
}

const filterList: SourceFilter[] = [
  {
    matches: [/\.m3u8/],
    type: DownloadType.m3u8,
    async handler(params) {
      const { url, headers, body } = params;

      const $ = load(body);
      const title = $("title").text();

      return {
        url,
        type: DownloadType.m3u8,
        name: title || "没有获取到名称",
        headers: JSON.stringify(headers),
      };
    },
  },
  {
    // TODO: 合集、列表、收藏夹
    matches: [/^https?:\/\/(www\.)?bilibili.com\/video/],
    type: DownloadType.bilibili,
    async handler(params) {
      const { url, body } = params;

      const $ = load(body);
      const title = $("title").text();

      return {
        url,
        type: DownloadType.bilibili,
        name: title || "没有获取到名称",
      };
    },
  },
];

@injectable()
export class SniffingHelper extends EventEmitter {
  private debugger: Electron.Debugger;
  private pageSources = new Set();
  private requestMap: Record<string, Omit<SourceParams, "body">> = {};
  private responseMap: Record<string, string[]> = {};

  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
  ) {
    super();
  }

  setDebugger(d: Electron.Debugger) {
    this.debugger = d;
  }

  reset() {
    this.pageSources.clear();
    this.responseMap = {};
    this.requestMap = {};
  }

  async getResponseBody(requestId: string): Promise<string> {
    const { body, base64Encoded } = await this.debugger.sendCommand(
      "Network.getResponseBody",
      {
        requestId,
      },
    );

    if (base64Encoded) {
      // base64 解码
      const bodyContent = Buffer.from(body, "base64").toString();
      return bodyContent;
    }

    return body;
  }

  start() {
    try {
      this.debugger.attach("1.1");
    } catch (err) {
      this.logger.error("Debugger attach failed : ", err);
    }

    this.debugger.on("detach", (event, reason) => {
      this.logger.error("Debugger detached due to : ", reason);
    });

    this.debugger.on("message", async (event, method, params) => {
      if (method === "Network.requestWillBeSent") {
        this.requestWillBeSent(params);
      }
      if (method === "Network.loadingFinished") {
        this.loadingFinished(params);
      }
    });

    this.debugger.sendCommand("Network.enable");
  }

  private requestWillBeSent(params: any) {
    const { requestId, documentURL } = params;
    const { url, headers } = params.request;

    for (const filter of filterList) {
      for (const match of filter.matches) {
        if (!match.test(url)) {
          continue;
        }

        if (this.pageSources.has(url)) {
          continue;
        }

        this.pageSources.add(url);
        this.responseMap[documentURL] = [];
        this.requestMap[requestId] = {
          url,
          headers,
          requestId,
          filter,
          documentURL,
        };
        break;
      }
    }
  }

  private async loadingFinished(params: any) {
    const { requestId } = params;
    const sourceParams = this.requestMap[requestId];

    if (sourceParams) {
      const { filter, url, documentURL } = sourceParams;
      const objUrl = new URL(url);

      if (this.responseMap[documentURL].length > 0) {
        const bodys = this.responseMap[documentURL];
        const exist = bodys.some((item) =>
          new RegExp(objUrl.pathname).test(item),
        );
        if (exist) return;
      }

      const body = await this.getResponseBody(requestId);
      this.responseMap[documentURL].push(body);
      this.logger.info(`在窗口中捕获视频链接: ${url}`);
      const item = await filter.handler.call(this, { ...sourceParams, body });
      this.emit("source", item);
    }
  }
}
