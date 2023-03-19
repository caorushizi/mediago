import { type BrowserWindow, type Session } from "electron";
import { ElectronLog } from "electron-log";
import Store from "electron-store";
import { EntityManager } from "typeorm";
import { AppStore } from "types";

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

export interface SessionService {
  get: () => Session;
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
}

export interface UserRepository {
  init: () => void;
}
