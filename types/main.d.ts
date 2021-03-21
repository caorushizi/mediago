import { BrowserWindow } from "electron";

declare global {
  namespace NodeJS {
    interface Global {
      __bin__: string;
    }
  }
}

declare var __bin__: string;

declare enum WindowName {
  MAIN_WINDOW = "MAIN_WINDOW",
  BROWSER_WINDOW = "BROWSER_WINDOW",
}

declare interface IWindowManager {
  create: (name: WindowName) => Promise<BrowserWindow | null>;
  get: (name: WindowName) => BrowserWindow | null;
  has: (name: WindowName) => boolean;
  deleteById: (id: number) => void;
}

declare interface IWindowListItem {
  url: string;
  options: () => Electron.BrowserWindowConstructorOptions;
  callback: (window: BrowserWindow, windowManager: IWindowManager) => void;
}

export { IWindowManager, IWindowListItem };
