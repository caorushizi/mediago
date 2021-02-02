import { app, BrowserWindow, BrowserView, ipcMain, session } from "electron";
import createServer from "./server";
import store from "./store";
import { exec, failFn, successFn } from "./utils";

// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

createServer();

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });
  // eslint-disable-next-line no-undef
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
  return mainWindow;
};

const createMainView = (window) => {
  const view = new BrowserView({
    webPreferences: {
      // nodeIntegration: true,
      // enableRemoteModule: true,
      // eslint-disable-next-line no-undef
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  view.setBounds({ x: 0, y: 0, height: 0, width: 0 });
  const { webContents } = view;
  webContents.openDevTools();
  const filter = {
    urls: ["*://*/*"],
  };
  const { webRequest } = webContents.session;
  webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    console.log("from here: ", details.url);
    const m3u8Reg = /\.m3u8$/;
    const tsReg = /\.ts$/;
    let cancel = false;
    const myURL = new URL(details.url);
    if (m3u8Reg.test(myURL.pathname)) {
      window.webContents.send("m3u8", details.url);
    } else if (tsReg.test(myURL.pathname)) {
      cancel = true;
    }
    callback({
      cancel,
      requestHeaders: details.requestHeaders,
    });
  });

  webContents.on("dom-ready", () => {
    webContents.on("new-window", async (event, url) => {
      event.preventDefault();
      await webContents.loadURL(url);
    });
  });

  return view;
};

const init = () => {
  const window = createMainWindow();
  const view = createMainView(window);
  window.setBrowserView(view);
};

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    init();
  }
});

app.whenReady().then(async () => {
  try {
    init();

    const reactTool = process.env.REACT_EXTENSION_PATH;
    await session.defaultSession.loadExtension(reactTool);

    const reduxTool = process.env.REDUX_EXTENSION_PATH;
    await session.defaultSession.loadExtension(reduxTool);
  } catch (e) {
    console.log("初始化失败：", e);
  }
});

ipcMain.on("exec", async (event, ...args) => {
  const [name, path, url] = args;

  let resp;
  try {
    const result = await exec(name, path, url);
    resp = successFn(result);
  } catch (e) {
    resp = failFn(-1, e.message);
  }
  event.reply("execReply", resp);
});

ipcMain.on("setLocalPath", async (event, ...args) => {
  const [key, value] = args;
  store.set(key, value);
  event.reply("setLocalPathReply");
});

ipcMain.handle("getLocalPath", (event, key) => store.get(key));
