import { join, extname } from "path";
import { readFile, readFileSync } from "fs";
import { URL } from "url";
import { app, BrowserWindow, protocol, crashReporter } from "electron";
import { autoUpdater } from "electron-updater";
import { log } from "main/utils";
import handleIpc from "main/helper/handleIpc";
import { defaultScheme, webviewPartition } from "main/variables";
import createSession from "main/session";
import handleStore from "main/helper/handleStore";
import handleExtension from "main/helper/handleExtension";
import handleWindows from "main/helper/handleWindows";
import * as Sentry from "@sentry/electron/dist/main";
import { name, author } from "../../package.json";

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
  autoUpdater.logger = log;
  autoUpdater.checkForUpdatesAndNotify();

  protocol.registerBufferProtocol(defaultScheme, (request, callback) => {
    let pathName = new URL(request.url).pathname;
    pathName = decodeURI(pathName);

    readFile(join(__dirname, "../renderer", pathName), (error, data) => {
      if (error) {
        console.error(
          `Failed to register ${webviewPartition} protocol\n`,
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

  const webviewSession = createSession(webviewPartition);
  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await handleWindows(webviewSession);
    }
  });

  handleWindows(webviewSession);
  handleExtension();
  handleStore();
  handleIpc();

  const setProxy = () => {
    const proxy = global.store.get("proxy");
    if (proxy) {
      log.info("proxy 设置成功");
      webviewSession.setProxy({ proxyRules: proxy });
    } else {
      webviewSession.setProxy({});
    }
  };

  setProxy();

  global.store.onDidChange("useProxy", (newValue) => {
    try {
      if (newValue) setProxy();
    } catch (e: any) {
      log.error("设置代理失败：", e.message);
    }
  });
});
