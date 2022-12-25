import { BrowserWindow, Session } from "electron";
import Store from "electron-store";
import { ElectronLog } from "electron-log";
import { SpawnOptions } from "child_process";
import { DataSource } from "typeorm";
import { Collection, Video } from "./entity";

export interface MainWindowService extends BrowserWindow {
  init: () => void;
}

export interface BrowserWindowService extends BrowserWindow {
  init: () => void;
}

export interface BrowserViewService {
  webContents: Electron.WebContents;
  init: () => void;
  getBounds: () => Electron.Rectangle;

  setAutoResize: (options: Electron.AutoResizeOptions) => void;

  setBackgroundColor: (color: string) => void;

  setBounds: (bounds: Electron.Rectangle) => void;
}

export interface App {
  init: () => void;
}

export interface ConfigService extends Store<AppStore> {
  init: () => void;
  setProxy: (isInit?: boolean) => void;
}

export interface IpcHandlerService {
  init: () => void;
}

export interface DataService extends DataSource {
  init: () => void;
}

export interface ProtocolService {
  create: () => void;
}

export interface UpdateService {
  init: () => void;
}

export interface SessionService {
  get: () => Session;
}

export type Controller = Record<string | symbol, any>;

export interface LoggerService {
  logger: ElectronLog;
  init: () => void;
}

export interface RunnerService {
  run: (options: SpawnOptions) => void;
}

export interface VideoRepository {
  getVideoList: () => Promise<Video[]>;

  findById: (id: number) => Promise<Video | null>;

  insertVideo: (video: Video) => Promise<Video>;

  updateVideo: (id: number, video: Partial<Video>) => Promise<void>;

  removeVideo: (id?: number) => Promise<void>;
}

export interface CollectionRepository {
  getCollectionList: () => Promise<Collection[]>;

  findById: (id: number) => Promise<Collection | null>;

  insertCollection: (video: Collection) => Promise<Collection>;

  updateCollection: (id: number, video: Partial<Collection>) => Promise<void>;

  removeCollection: (id?: number) => Promise<void>;
}
