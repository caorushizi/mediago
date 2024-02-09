export const TYPES = {
  ElectronApp: Symbol.for("ElectronApp"),
  IpcHandlerService: Symbol.for("IpcHandlerService"),
  Controller: Symbol.for("Controller"),
  // repository
  VideoRepository: Symbol.for("VideoRepository"),
  FavoriteRepository: Symbol.for("FavoriteRepository"),
  // windows
  BrowserWindow: Symbol.for("BrowserWindow"),
  PlayerWindow: Symbol.for("PlayerWindow"),
  MainWindow: Symbol.for("MainWindow"),
  // services
  WebviewService: Symbol.for("WebviewService"),
  DownloadService: Symbol.for("DownloadService"),
  DevToolsService: Symbol.for("DevToolsService"),
  VideoService: Symbol.for("VideoService"),
  StoreService: Symbol.for("StoreService"),
  SessionService: Symbol.for("SessionService"),
  DatabaseService: Symbol.for("DatabaseService"),
  ProtocolService: Symbol.for("ProtocolService"),
  UpdateService: Symbol.for("UpdateService"),
  LoggerService: Symbol.for("LoggerService"),
  SniffingHelper: Symbol.for("SniffingHelper"),
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
