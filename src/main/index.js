import { app, BrowserWindow, BrowserView, ipcMain, session } from "electron";
import { spawn } from "child_process";
import path from "path";
import createServer from "./server";
import store from "./store";

// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

createServer();

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  const view = new BrowserView({
    webPreferences: {
      // nodeIntegration: true,
      // enableRemoteModule: true,
      // eslint-disable-next-line no-undef
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  view.setBounds({ x: 0, y: 0, height: 0, width: 0 });
  view.webContents.openDevTools();

  const filter = {
    urls: ["*://*/*"],
  };
  view.webContents.session.webRequest.onBeforeSendHeaders(
    filter,
    (details, callback) => {
      console.log("from here: ", details.url);
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  mainWindow.setBrowserView(view);
  // eslint-disable-next-line no-undef
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();

  const exec = (n, p, u) =>
    new Promise((resolve, reject) => {
      const args = ["--path", p, "--name", n, "--url", u];
      const command = spawn("mediago", args);
      let errMsg = "";

      command.stdout.on("data", (data) => {
        console.log(data.toString());
      });

      command.stderr.on("data", (data) => {
        errMsg += data;
      });

      command.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(errMsg));
        } else {
          resolve();
        }
      });
    });

  const successFn = (data) => ({ code: 0, msg: "", data });
  const failFn = (code, msg) => ({ code, msg, data: null });

  ipcMain.on("exec", async (event, ...args) => {
    const [nameString, pathString, urlString] = args;

    let resp;
    try {
      const result = await exec(nameString, pathString, urlString);
      resp = successFn(result);
    } catch (e) {
      resp = failFn(-1, e.message);
    }
    event.reply("execReply", resp);
  });
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  try {
    const reactTool = process.env.REACT_EXTENSION_PATH;
    await session.defaultSession.loadExtension(reactTool);

    const reduxTool = process.env.REDUX_EXTENSION_PATH;
    await session.defaultSession.loadExtension(reduxTool);
  } catch (e) {
    console.log("加载开发者工具失败：", e);
  }
});

ipcMain.on("setLocalPath", async (event, ...args) => {
  const [key, value] = args;
  store.set(key, value);
  event.reply("setLocalPathReply");
});

ipcMain.handle("getLocalPath", (event, key) => store.get(key));
