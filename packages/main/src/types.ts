const TYPES = {
  MainWindowService: Symbol.for("MainWindowService"),
  BrowserViewService: Symbol.for("BrowserViewService"),
  ConfigService: Symbol.for("ConfigService"),
  SessionService: Symbol.for("SessionService"),
  DataService: Symbol.for("DataService"),
  ProtocolService: Symbol.for("ProtocolService"),
  UpdateService: Symbol.for("UpdateService"),
  LoggerService: Symbol.for("LoggerService"),
  IpcHandlerService: Symbol.for("IpcHandlerService"),
  RunnerService: Symbol.for("RunnerService"),
  Controller: Symbol.for("Controller"),
  App: Symbol.for("App"),
  VideoRepository: Symbol.for("VideoRepository"),
  CollectionRepository: Symbol.for("CollectionRepository"),
};

export { TYPES };
