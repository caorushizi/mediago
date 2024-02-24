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
  VideoService: Symbol.for("VideoService"),
  SessionService: Symbol.for("SessionService"),
  ProtocolService: Symbol.for("ProtocolService"),
  SniffingHelper: Symbol.for("SniffingHelper"),
  // vendor
  ElectronLogger: Symbol.for("ElectronLogger"),
  ElectronUpdater: Symbol.for("ElectronUpdater"),
  ElectronStore: Symbol.for("ElectronStore"),
  ElectronDevtools: Symbol.for("ElectronDevtools"),
  TypeORM: Symbol.for("TypeORM"),
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
