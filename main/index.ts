import { app, BrowserView, BrowserWindow, ipcMain, session } from "electron";
import { is } from "electron-util";
import path from "path";
import store from "./store";
import { exec, failFn, successFn } from "./utils";
import logger from "./logger";
import XhrFilter from "./xhrFilter";
import windowManager from "./window/windowManager";
import { WindowName } from "./window/variables";

// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

const xhrFilter = new XhrFilter();

if (!is.development) {
  global.__bin__ = path
    .resolve(app.getAppPath(), "../.bin")
    .replace(/\\/g, "\\\\");
}

const init = async () => {
  const mainWindow = await windowManager.create(WindowName.MAIN_WINDOW);
  const browserWindow = await windowManager.create(WindowName.BROWSER_WINDOW);

  const partition = "persist:webview";
  const ses = session.fromPartition(partition);

  ses.protocol.registerFileProtocol("webview", (request, callback) => {
    const url = request.url.substr(10);
    callback({ path: path.normalize(`${__dirname}/${url}`) });
  });

  const view = new BrowserView({ webPreferences: { partition } });
  browserWindow.setBrowserView(view);
  browserWindow.webContents.send("viewReady");
  view.setBounds({ x: 0, y: 0, height: 0, width: 0 });

  const { webContents } = view;
  if (is.development) webContents.openDevTools();

  webContents.on("dom-ready", () => {
    webContents.on("new-window", async (event, url) => {
      event.preventDefault();
      await webContents.loadURL(url);
    });
  });

  const filter = { urls: ["*://*/*"] };
  ses.webRequest.onBeforeSendHeaders(filter, xhrFilter.beforeSendHeaders);
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await init();
  }
});

app.whenReady().then(async () => {
  await init();

  if (is.development) {
    try {
      const reactTool = path.resolve(__dirname, "../devtools/react");
      await session.defaultSession.loadExtension(reactTool);
      const reduxTool = path.resolve(__dirname, "../devtools/redux");
      await session.defaultSession.loadExtension(reduxTool);
    } catch (e) {
      logger.info(e);
    }
  }
});

ipcMain.on("exec", async (event, exeFile, ...args) => {
  let resp;
  try {
    const result = await exec(exeFile, ...args);
    resp = successFn(result);
  } catch (e) {
    resp = failFn(-1, e.message);
  }
  event.reply("execReply", resp);
});

ipcMain.on("setLocalPath", async (event, ...args) => {
  let resp;
  try {
    const [key, value] = args;
    store.set(key, value);
    resp = successFn("");
  } catch (e) {
    logger.info("设置 store 失败：", e.message);
    resp = failFn(-1, "设置 store 失败");
  }
  event.reply("setLocalPathReply", resp);
});

ipcMain.handle("getLocalPath", (event, key) => {
  try {
    return store.get(key);
  } catch (e) {
    logger.info("获取 store 中数据失败：", e.message);
    return "";
  }
});

ipcMain.on("closeMainWindow", async () => {
  app.quit();
});
