import { app, BrowserWindow } from "electron";

// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

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
};

app.on("ready", createWindow);

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
