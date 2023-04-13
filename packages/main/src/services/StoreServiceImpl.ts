import Store from "electron-store";
import { session } from "electron/main";
import { inject, injectable } from "inversify";
import { AppStore } from "main";
import { download, PERSIST_WEBVIEW, workspace } from "../helper/variables";
import { StoreService } from "../interfaces";
import { TYPES } from "../types";
import LoggerServiceImpl from "./LoggerServiceImpl";

@injectable()
export default class StoreServiceImpl
  extends Store<AppStore>
  implements StoreService
{
  constructor(
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerServiceImpl
  ) {
    super({
      name: "config",
      cwd: workspace,
      fileExtension: "json",
      watch: true,
      defaults: {
        local: download,
        promptTone: true,
        proxy: "",
        useProxy: false,
        deleteSegments: true,
      },
    });
  }

  init(): void {
    const useProxy = this.get("useProxy");
    const proxy = this.get("proxy");
    this.setProxy(useProxy, proxy, true);
  }

  async setProxy(
    useProxy: boolean,
    proxy: string,
    isInit?: boolean
  ): Promise<void> {
    try {
      if (useProxy) {
        if (!proxy) {
          return Promise.reject("请先设置代理地址");
        }
        if (!/https?:\/\//.test(proxy)) {
          proxy = `http://${proxy}`;
        }
        session.fromPartition(PERSIST_WEBVIEW).setProxy({ proxyRules: proxy });
        this.logger.info(
          `[proxy] ${isInit ? "初始化" : "开启"}成功，代理地址为${proxy}`
        );
      } else {
        session.fromPartition(PERSIST_WEBVIEW).setProxy({});
        if (!isInit) this.logger.info("[proxy] 关闭成功");
      }
    } catch (e: any) {
      this.logger.error(
        `[proxy] ${isInit ? "初始化" : ""}设置代理失败：\n${e.message}`
      );
    }
  }
}
