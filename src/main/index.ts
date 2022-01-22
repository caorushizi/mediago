import { extname, join } from "path";
import { readFile, readFileSync } from "fs";
import { URL } from "url";
import { app, BrowserWindow, crashReporter, protocol } from "electron";
import { autoUpdater } from "electron-updater";
import handleIpc from "main/helper/handleIpc";
import { defaultScheme, Sessions } from "main/utils/variables";
import handleStore from "main/helper/handleStore";
import handleExtension from "main/helper/handleExtension";
import handleWindows from "main/helper/handleWindows";
import * as Sentry from "@sentry/electron/dist/main";
import { author, name } from "../../package.json";
import sessionList from "main/core/session";
import logger from "main/core/logger";

Sentry.init({ dsn: process.env.VITE_APP_SENTRY_DSN });

crashReporter.start({
  companyName: author,
  productName: name,
  ignoreSystemCrashHandler: true,
  submitURL: process.env.VITE_APP_SENTRY_DSN,
});

if (require("electron-squirrel-startup")) {
  app.quit();
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: defaultScheme,
    privileges: {
      secure: true,
      standard: true,
    },
  },
]);

app.whenReady().then(async () => {
  autoUpdater.logger = logger;
  autoUpdater.checkForUpdatesAndNotify({
    title: "发现新版本",
    body: "已经下载完成，下次打开时安装~",
  });

  protocol.registerBufferProtocol(defaultScheme, (request, callback) => {
    let pathName = new URL(request.url).pathname;
    pathName = decodeURI(pathName);

    readFile(join(__dirname, "../renderer", pathName), (error, data) => {
      if (error) {
        console.error(
          `Failed to register ${defaultScheme} protocol\n`,
          error,
          "\n"
        );
        const data = readFileSync(join(__dirname, "../renderer/index.html"));
        callback({ mimeType: "text/html", data });
      } else {
        const extension = extname(pathName).toLowerCase();
        let mimeType = "";

        if (extension === ".js") {
          mimeType = "text/javascript";
        } else if (extension === ".html") {
          mimeType = "text/html";
        } else if (extension === ".css") {
          mimeType = "text/css";
        } else if (extension === ".svg" || extension === ".svgz") {
          mimeType = "image/svg+xml";
        } else if (extension === ".json") {
          mimeType = "application/json";
        }

        callback({ mimeType, data });
      }
    });
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await handleWindows();
    }
  });

  handleWindows();
  handleExtension();
  handleStore();
  handleIpc();

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
});
