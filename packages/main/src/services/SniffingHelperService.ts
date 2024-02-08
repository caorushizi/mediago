import { inject, injectable } from "inversify";
import { DownloadType } from "../interfaces";
import { TYPES } from "../types";
import LoggerService from "../services/LoggerService";
import { load } from "cheerio";
import EventEmitter from "events";

interface SourceParams {
  url: string;
  requestId: string;
  headers: Record<string, any>;
  filter: SourceFilter;
  documentURL: string;
  body: string;
  title: string;
}

interface SourceFilter {
  matches: RegExp[];
  type: DownloadType;
  schema?: Record<string, string>;
}

interface BaseInfo {
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
  private debugger: Electron.Debugger;
  private pageSources = new Set();
  private requestMap: Record<string, Omit<SourceParams, "body">> = {};
  private responseMap: Record<string, string[]> = {};
  private baseInfo: BaseInfo = { title: "", url: "" };

  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService,
  ) {
    super();
  }

  setDebugger(d: Electron.Debugger) {
    this.debugger = d;
  }

  reset(baseInfo: BaseInfo) {
    this.pageSources.clear();
    this.responseMap = {};
    this.requestMap = {};
    this.baseInfo = baseInfo;
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
    } catch (err) {
      this.logger.error("Debugger attach failed : ", err);
    }
  }

  private requestWillBeSent(params: any) {
    const { requestId, documentURL } = params;
    const { url, headers } = params.request;
    const { title } = this.baseInfo;

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
          title,
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
      const item = this.handle(
        {
          ...sourceParams,
          body,
        },
        filter.schema,
      );
      // FIXME: 为了测试，延迟 1s
      setTimeout(() => {
        this.emit("source", item);
      }, 1000);
    }
  }

  handle(params: SourceParams, schema: Record<string, string> = {}) {
    const { filter, url, title, headers } = params;

    const data = {
      url,
      type: filter.type,
      name: title || "没有获取到名称",
      headers: headers && JSON.stringify(headers),
    };

    for (const [key, value] of Object.entries(schema)) {
      if (key === "name") {
        data.name = this.handleName(params, value);
      }
    }

    return data;
  }

  handleName(params: SourceParams, value: string) {
    const { body } = params;

    const $ = load(body);
    const title = $(value).text();

    return title;
  }
}
