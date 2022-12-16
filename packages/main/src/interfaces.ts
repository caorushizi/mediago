import { BrowserWindow, Session } from "electron";
import Store from "electron-store";
import { ElectronLog } from "electron-log";
import { SpawnOptions } from "child_process";
import { DataSource } from "typeorm";
import { Video } from "./entity";

export interface MainWindowService extends BrowserWindow {
  init(): void;
}

export interface BrowserWindowService extends BrowserWindow {
  init(): void;
}

export interface BrowserViewService {
  webContents: Electron.WebContents;
  init(): void;
  getBounds(): Electron.Rectangle;

  setAutoResize(options: Electron.AutoResizeOptions): void;

  setBackgroundColor(color: string): void;

  setBounds(bounds: Electron.Rectangle): void;
}

export interface App {
  init(): void;
}

export interface ConfigService extends Store<AppStore> {
  init(): void;
  setProxy(isInit?: boolean): void;
}

export interface IpcHandlerService {
  init(): void;
}

export interface DataService extends DataSource {
  init(): void;
}

export interface ProtocolService {
  create(): void;
}

export interface UpdateService {
  init(): void;
}

export interface SessionService {
  get(): Session;
}

export interface Controller {
  [key: string | symbol]: any;
}

export interface LoggerService {
  logger: ElectronLog;
  init(): void;
}

export interface RunnerService {
  run(options: SpawnOptions): void;
}

export interface VideoRepository {
  getVideoList(): Promise<Video[]>;

  insertVideo(video: Video): Promise<Video>;
}
