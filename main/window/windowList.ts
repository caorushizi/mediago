import { IWindowListItem } from "../../types/main";
import { is } from "electron-util";
import { ipcMain } from "electron";
import logger from "../utils/logger";
import { WindowName } from "./variables";

const windowList = new Map<WindowName, IWindowListItem>();

windowList.set(WindowName.MAIN_WINDOW, {
  url: is.development
    ? "http://localhost:3000/main_window.html"
    : "mediago://electron/main_window.html",
  options() {
    return {
      width: 590,
      minWidth: 590,
      height: 600,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    };
  },
  async callback(window) {
    if (is.development) window.webContents.openDevTools();
  },
});

windowList.set(WindowName.BROWSER_WINDOW, {
  url: is.development
    ? "http://localhost:3000/browser_window.html"
    : "mediago://electron/browser_window.html",
  options() {
    return {
      width: 800,
      height: 600,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    };
  },
  async callback(window) {
    if (is.development) window.webContents.openDevTools();

    ipcMain.on("openBrowserWindow", () => {
      window.show();
    });

    ipcMain.on("closeBrowserWindow", () => {
      logger.info("closeBrowserWindow");
      window.hide();
    });
  },
});

export default windowList;
