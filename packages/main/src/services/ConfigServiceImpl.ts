import { ConfigService } from "../interfaces";
import Store from "electron-store";
import { workspace } from "../utils/variables";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import SessionServiceImpl from "./SessionServiceImpl";
import LoggerServiceImpl from "./LoggerServiceImpl";

@injectable()
export default class ConfigServiceImpl
  extends Store<AppStore>
  implements ConfigService {
  constructor(
    @inject(TYPES.SessionService) private session: SessionServiceImpl,
    @inject(TYPES.LoggerService) private logger: LoggerServiceImpl
  ) {
    const exeFile = process.platform === "win32" ? "N_m3u8DL-CLI" : "mediago";

    super({
      name: "config",
      cwd: workspace,
      fileExtension: "json",
      watch: true,
      defaults: {
        workspace: "",
        exeFile,
        tip: true,
        proxy: "",
        useProxy: false,
        statistics: true,
      },
    });
  }
  init(): void {
    this.setProxy(true);

    this.onDidChange("useProxy", this.setProxy);
  }

  setProxy(isInit?: boolean): void {
    try {
      const proxy = this.get("proxy");
      const useProxy = this.get("useProxy");
      if (proxy && useProxy) {
        this.logger.logger.info(
          `[proxy] ${isInit ? "初始化" : "开启"}成功，代理地址为${proxy}`
        );
        void this.session.get().setProxy({ proxyRules: proxy });
      } else {
        if (!isInit) this.logger.logger.info(`[proxy] 关闭成功`);
        void this.session.get().setProxy({});
      }
    } catch (e: any) {
      this.logger.logger.error(
        `[proxy] ${isInit ? "初始化" : ""}设置代理失败：\n${e.message}`
      );
    }
  }
}
