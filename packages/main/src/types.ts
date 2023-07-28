export const TYPES = {
  ElectronApp: Symbol.for("ElectronApp"),
  MainWindow: Symbol.for("MainWindow"),
  StoreService: Symbol.for("StoreService"),
  SessionService: Symbol.for("SessionService"),
  DatabaseService: Symbol.for("DatabaseService"),
  ProtocolService: Symbol.for("ProtocolService"),
  UpdateService: Symbol.for("UpdateService"),
  LoggerService: Symbol.for("LoggerService"),
  IpcHandlerService: Symbol.for("IpcHandlerService"),
  Controller: Symbol.for("Controller"),
  VideoRepository: Symbol.for("VideoRepository"),
  FavoriteRepository: Symbol.for("FavoriteRepository"),
  WebviewService: Symbol.for("WebviewService"),
  DownloadService: Symbol.for("DownloadService"),
  BrowserWindow: Symbol.for("BrowserWindow"),
  DevToolsService: Symbol.for("DevToolsService"),
  WebService: Symbol.for("WebService"),
  PlayerWindow: Symbol.for("PlayerWindow"),
};

export enum AppTheme {
  System = "system",
  Light = "light",
  Dark = "dark",
}
