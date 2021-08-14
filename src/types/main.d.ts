import { BrowserWindow } from "electron";
import { Windows } from "main/window/variables";
import Store from "electron-store";

declare global {
  namespace NodeJS {
    interface Global {
      __bin__: string;
      store: Store<AppStore>;
    }
  }
}

declare interface IWindowManager {
  create: (name: Windows) => Promise<BrowserWindow | null>;
  get: (name: Windows) => BrowserWindow | null;
  has: (name: Windows) => boolean;
  deleteById: (id: number) => void;
}

declare interface IWindowListItem {
  url: string;
  options: () => Electron.BrowserWindowConstructorOptions;
  callback: (window: BrowserWindow, windowManager: IWindowManager) => void;
}

export { IWindowManager, IWindowListItem };
