const TYPES = {
  App: Symbol.for("App"),
  MainWindowService: Symbol.for("MainWindowService"),
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
};

export { TYPES };
