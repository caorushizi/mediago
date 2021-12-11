import { IWindowListItem } from "types/main";
import { resolve } from "path";
import { Windows } from "main/variables";

const windowList = new Map<Windows, IWindowListItem>();

windowList.set(Windows.MAIN_WINDOW, {
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:7789/main"
      : "mediago://renderer/index.html/main",
  options(): Electron.BrowserWindowConstructorOptions {
    return {
      width: 800,
      minWidth: 800,
      height: 600,
      minHeight: 600,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: resolve(__dirname, "../preload/index.js"),
      },
    };
  },
  callback(window) {
    if (process.env.NODE_ENV === "development") {
      window.webContents.openDevTools();
    }
    window.once("ready-to-show", () => {
      window.show();
    });
  },
});

windowList.set(Windows.BROWSER_WINDOW, {
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:7789/browser"
      : "mediago://renderer/index.html/browser",
  options(): Electron.BrowserWindowConstructorOptions {
    return {
      width: 800,
      height: 600,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: resolve(__dirname, "../preload/index.js"),
      },
    };
  },
  async callback(window) {
    if (process.env.NODE_ENV === "development") {
      window.webContents.openDevTools();
    }
  },
});

export default windowList;
