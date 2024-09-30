import { Config } from "./entity/Config.ts";

export const TYPES = {
  ElectronApp: Symbol.for("ElectronApp"),
  RouterHandlerService: Symbol.for("RouterHandlerService"),
  Controller: Symbol.for("Controller"),
  // repository
  VideoRepository: Symbol.for("VideoRepository"),
  FavoriteRepository: Symbol.for("FavoriteRepository"),
  ConversionRepository: Symbol.for("ConversionRepository"),
  ConfigRepository: Symbol.for("ConfigRepository"),
  // windows
  BrowserWindow: Symbol.for("BrowserWindow"),
  MainWindow: Symbol.for("MainWindow"),
  PlayerWindow: Symbol.for("PlayerWindow"),
  // services
  HomeService: Symbol.for("HomeService"),
  DownloadService: Symbol.for("DownloadService"),
  SessionService: Symbol.for("SessionService"),
  ProtocolService: Symbol.for("ProtocolService"),
  VideoService: Symbol.for("VideoService"),
  SniffingHelper: Symbol.for("SniffingHelper"),
  ConfigService: Symbol.for("ConfigService"),
  DownloaderService: Symbol.for("DownloaderService"),
  // vendor
  TypeORM: Symbol.for("TypeORM"),
  Logger: Symbol.for("Logger"),
  SocketIO: Symbol.for("SocketIO"),
};

export enum AppTheme {
  System = "system",
  Light = "light",
  Dark = "dark",
}

export enum AppLanguage {
  System = "system",
  ZH = "zh",
  EN = "en",
}

export interface ConfigParams {
  key: keyof Config;
  val: Config[keyof Config];
}
