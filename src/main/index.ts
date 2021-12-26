import { app, BrowserWindow, protocol, session } from "electron";
import { resolve } from "path";
import { log } from "main/utils";
import windowManager from "main/window/windowManager";
import handleIpc from "main/handleIpc";
import createBrowserView from "main/browserView";
import Store from "electron-store";
import {
  defaultScheme,
  webviewPartition,
  Windows,
  workspace,
} from "main/variables";
import createSession from "main/session";
import { URL } from "url";
import { readFile } from "fs";
import path from "path";

if (require("electron-squirrel-startup")) {
  app.quit();
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const init = async (webviewSession: Electron.Session) => {
  windowManager.create(Windows.MAIN_WINDOW);
  await windowManager.create(Windows.BROWSER_WINDOW);
  await createBrowserView(webviewSession);
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: defaultScheme,
    privileges: {
      secure: true,
      standard: true,
    },
  },
]);

app.whenReady().then(() => {
  protocol.registerBufferProtocol(defaultScheme, (request, callback) => {
    let pathName = new URL(request.url).pathname;
    pathName = decodeURI(pathName);

    readFile(path.join(__dirname, "../renderer", pathName), (error, data) => {
      if (error) {
        console.error(
          `Failed to register ${webviewPartition} protocol\n`,
          error,
          "\n"
        );
      } else {
        const extension = path.extname(pathName).toLowerCase();
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
      await init(webviewSession);
    }
  });

  init(webviewSession);

  if (process.env.NODE_ENV === "development") {
    try {
      const reactTool = resolve(__dirname, "../../devtools/react");
      session.defaultSession.loadExtension(reactTool);
      const reduxTool = resolve(__dirname, "../../devtools/redux");
      session.defaultSession.loadExtension(reduxTool);
    } catch (e) {
      log.info(e);
    }
  }

  let exeFile = "";
  if (process.platform === "win32") {
    exeFile = "N_m3u8DL-CLI";
  } else {
    exeFile = "mediago";
  }

  const store = new Store<AppStore>({
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
    },
  });

  const setProxy = () => {
    const proxy = store.get("proxy");
    if (proxy) {
      log.info("proxy 设置成功");
      webviewSession.setProxy({ proxyRules: proxy });
    } else {
      webviewSession.setProxy({});
    }
  };

  setProxy();

  store.onDidChange("useProxy", (newValue) => {
    try {
      if (newValue) setProxy();
    } catch (e: any) {
      log.error("设置代理失败：", e.message);
    }
  });

  global.store = store;
});

handleIpc();
