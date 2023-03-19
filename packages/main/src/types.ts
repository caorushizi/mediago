const TYPES = {
  MainWindowService: Symbol.for("MainWindowService"),
  StoreService: Symbol.for("StoreService"),
  SessionService: Symbol.for("SessionService"),
  DatabaseService: Symbol.for("DatabaseService"),
  ProtocolService: Symbol.for("ProtocolService"),
  UpdateService: Symbol.for("UpdateService"),
  LoggerService: Symbol.for("LoggerService"),
  IpcHandlerService: Symbol.for("IpcHandlerService"),
  Controller: Symbol.for("Controller"),
  App: Symbol.for("App"),
  UserRepository: Symbol.for("UserRepository"),
  FavoriteRepository: Symbol.for("FavoriteRepository"),
  WebviewService: Symbol.for("WebviewService"),
};

export { TYPES };

export interface AppStore {
  local: string;
}
