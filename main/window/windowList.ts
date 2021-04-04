import { IWindowListItem } from "../../types/main";
import { is } from "electron-util";
import { Windows } from "./variables";
import { resolve } from "path";

const windowList = new Map<Windows, IWindowListItem>();

windowList.set(Windows.MAIN_WINDOW, {
  url: is.development
    ? "http://localhost:3000/main_window.html"
    : "mediago://electron/main_window.html",
  options() {
    return {
      width: 590,
      minWidth: 590,
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

    window.once("ready-to-show", () => {
      window.show();
    });
  },
});

windowList.set(Windows.BROWSER_WINDOW, {
  url: is.development
    ? "http://localhost:3000/browser_window.html"
    : "mediago://electron/browser_window.html",
  options(): Electron.BrowserWindowConstructorOptions {
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
  },
});

windowList.set(Windows.SETTING_WINDOW, {
  url: is.development
    ? "http://localhost:3000/setting_window.html"
    : "mediago://electron/setting_window.html",
  options(): Electron.BrowserWindowConstructorOptions {
    return {
      width: 600,
      height: 400,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: resolve(__dirname, "./preload.js"),
      },
    };
  },
  async callback(window) {
    if (is.development) window.webContents.openDevTools();
  },
});

export default windowList;
