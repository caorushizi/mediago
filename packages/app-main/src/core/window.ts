import { BrowserWindow } from "electron";
import { Windows } from "../utils/variables";
import { resolve } from "path";
import { IWindowListItem, IWindowManager } from "../../main";

const windowList = new Map<Windows, IWindowListItem>();

windowList.set(Windows.MAIN_WINDOW, {
  url:
    process.env.NODE_ENV === "development"
      ? "http://localhost:7789/main"
      : "mediago://index.html/main",
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
        preload: resolve(__dirname, "../.electron/preload.js"),
      },
    };
  },
  async callback(window) {
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
      : "mediago://index.html/browser",
  options(): Electron.BrowserWindowConstructorOptions {
    return {
      width: 800,
      height: 600,
      show: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: resolve(__dirname, "../.electron/preload.js"),
      },
    };
  },
  async callback(window) {
    if (process.env.NODE_ENV === "development") {
      window.webContents.openDevTools();
    }
  },
});

class Window implements IWindowManager {
  private windowMap: Map<Windows | string, BrowserWindow> = new Map();

  private windowIdMap: Map<number, Windows | string> = new Map();

  async create(name: Windows) {
    const windowConfig: IWindowListItem = windowList.get(name)!;
    const window = new BrowserWindow(windowConfig.options());
    const { id } = window;
    this.windowMap.set(name, window);
    this.windowIdMap.set(window.id, name);
    window.loadURL(windowConfig.url);
    windowConfig.callback(window, this);
    window.on("close", () => {
      this.deleteById(id);
    });
    return window;
  }

  get(name: Windows) {
    return this.windowMap.get(name)!;
  }

  has(name: Windows) {
    return this.windowMap.has(name);
  }

  deleteById = (id: number) => {
    const name = this.windowIdMap.get(id);
    if (name) {
      this.windowMap.delete(name);
      this.windowIdMap.delete(id);
    }
  };
}

const windowManager = new Window();

export { windowManager, windowList };
