import { type BrowserWindow, type Session } from "electron";
import { ElectronLog } from "electron-log";
import Store from "electron-store";
import { Favorite } from "entity/Favorite";
import { AppStore } from "main";
import { EntityManager } from "typeorm";

export interface MainWindowService extends BrowserWindow {
  init: () => void;
}

export interface App {
  init: () => void;
}

export interface IpcHandlerService {
  init: () => void;
}

export interface ProtocolService {
  create: () => void;
}

export interface UpdateService {
  init: () => void;
}

export interface DatabaseService {
  manager: EntityManager;
  init: () => void;
}

export type Controller = Record<string | symbol, any>;

export interface LoggerService {
  logger: ElectronLog;
  init: () => void;
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export interface StoreService extends Store<AppStore> {
  init: () => void;
  setProxy: (useProxy: boolean, isInit?: boolean) => Promise<void>;
}

export interface UserRepository {
  init: () => void;
}

export interface FavoriteRepository {
  findFavorites: () => Promise<Favorite[]>;
  addFavorite: (favorite: Favorite) => Promise<Favorite>;
  removeFavorite: (url: string) => Promise<void>;
}

export interface WebviewService {
  webContents: Electron.WebContents;
  init: () => void;
  getBounds: () => Electron.Rectangle;
  setAutoResize: (options: Electron.AutoResizeOptions) => void;
  setBackgroundColor: (color: string) => void;
  setBounds: (bounds: Electron.Rectangle) => void;
  loadURL: (url?: string) => void;
  goBack: () => Promise<boolean>;
  reload: () => Promise<void>;
  goHome: () => Promise<void>;
}
