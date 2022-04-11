import Store from "electron-store";
import { Sessions, workspace } from "main/utils/variables";
import { sessionList } from "main/core/session";
import logger from "main/core/logger";

export default function handleStore(): void {
  let exeFile = "";
  if (process.platform === "win32") {
    exeFile = "N_m3u8DL-CLI";
  } else {
    exeFile = "mediago";
  }

  global.store = new Store<AppStore>({
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

  // 设置软件代理
  const setProxy = (isInit?: boolean) => {
    try {
      const webviewSession = sessionList.get(Sessions.PERSIST_MEDIAGO)!;
      const proxy = global.store.get("proxy");
      const useProxy = global.store.get("useProxy");
      if (proxy && useProxy) {
        logger.info(
          `[proxy] ${isInit ? "初始化" : "开启"}成功，代理地址为${proxy}`
        );
        webviewSession.setProxy({ proxyRules: proxy });
      } else {
        if (!isInit) logger.info(`[proxy] 关闭成功`);
        webviewSession.setProxy({});
      }
    } catch (e: any) {
      logger.error(
        `[proxy] ${isInit ? "初始化" : ""}设置代理失败：\n${e.message}`
      );
    }
  };

  setProxy(true);

  global.store.onDidChange("useProxy", setProxy);
}
