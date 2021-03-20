import { app, BrowserView, BrowserWindow, ipcMain, session } from "electron";
import { is } from "electron-util";
import path from "path";
import store from "./store";
import { exec, failFn, successFn } from "./utils";
import logger from "./logger";

// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

if (!is.development) {
  global.__bin__ = path
    .resolve(app.getAppPath(), "../.bin")
    .replace(/\\/g, "\\\\");
}

const createMainWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 590,
    minWidth: 590,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  await mainWindow.loadURL("http://localhost:3000/main_window/");
  if (is.development) mainWindow.webContents.openDevTools();
  return mainWindow;
};

const createBrowserWindow = async () => {
  const browserWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  await browserWindow.loadURL("http://localhost:3000/browser_window/");
  if (is.development) browserWindow.webContents.openDevTools();

  ipcMain.on("openBrowserWindow", () => {
    browserWindow.show();
  });

  ipcMain.on("closeBrowserWindow", () => {
    logger.info("closeBrowserWindow");
    browserWindow.hide();
  });

  return browserWindow;
};

const init = async () => {
  const mainWindow = await createMainWindow();
  const browserWindow = await createBrowserWindow();

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
  // if (is.development) webContents.openDevTools();

  webContents.on("dom-ready", () => {
    webContents.on("new-window", async (event, url) => {
      event.preventDefault();
      await webContents.loadURL(url);
    });
  });

  ses.webRequest.onBeforeSendHeaders(
    { urls: ["*://*/*"] },
    (details, callback) => {
      const m3u8Reg = /\.m3u8$/;
      const tsReg = /\.ts$/;
      let cancel = false;
      const myURL = new URL(details.url);
      if (m3u8Reg.test(myURL.pathname)) {
        logger.info("在窗口中捕获 m3u8 链接: ", details.url);
        mainWindow.webContents.send("m3u8", {
          title: webContents.getTitle(),
          requestDetails: details,
        });
      } else if (tsReg.test(myURL.pathname)) {
        cancel = true;
      }
      callback({
        cancel,
        requestHeaders: details.requestHeaders,
      });
    }
  );
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
