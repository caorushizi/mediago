import Store from "electron-store/index";

import { BrowserWindow } from "electron";
import { Windows } from "./utils/variables";

declare interface IWindowManager {
  create: (name: Windows) => Promise<BrowserWindow | null>;
  get: (name: Windows) => BrowserWindow | null;
  has: (name: Windows) => boolean;
  deleteById: (id: number) => void;
}

declare interface IWindowListItem {
  url: string;
  options: () => Electron.BrowserWindowConstructorOptions;
  callback: (
    window: BrowserWindow,
    windowManager: IWindowManager
  ) => Promise<void>;
}

export { IWindowManager, IWindowListItem };

declare global {
  namespace NodeJS {
    interface Global {
      __bin__: string;
      store: Store<AppStore>;
    }
  }
}
