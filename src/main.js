import { app, BrowserWindow, ipcMain } from "electron";
import { spawn } from "child_process";
import createServer from "./server";

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
      enableRemoteModule: true,
      nodeIntegration: true,
    },
  });

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

  ipcMain.on("asynchronous-message", async (event, ...args) => {
    const [nameString, pathString, urlString] = args;

    let resp;
    try {
      const result = await exec(nameString, pathString, urlString);
      resp = successFn(result);
    } catch (e) {
      resp = failFn(-1, e.message);
    }
    event.reply("asynchronous-reply", resp);
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

const { session } = require("electron");
const path = require("path");

app.whenReady().then(async () => {
  try {
    const reactDevToolsPath = path.join(
      "C:\\Users\\ziying\\AppData\\Local\\Google",
      "Chrome\\User Data\\Default\\Extensions",
      "fmkadmapgofadopljbjfkapdkoienihi",
      "4.10.1_0"
    );
    await session.defaultSession.loadExtension(reactDevToolsPath);
    console.log("success: react");

    const reduxDevToolPath = path.join(
      "C:\\Users\\ziying\\AppData\\Local\\Google",
      "Chrome\\User Data\\Default\\Extensions",
      "lmhkpmbekcpmknklioeibfkpmmfibljd",
      "2.17.0_0"
    );
    await session.defaultSession.loadExtension(reduxDevToolPath);
    console.log("success: redux");
  } catch (e) {
    console.log(`error: ${e.message}`);
  }
});
