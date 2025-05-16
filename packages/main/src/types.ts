export const TYPES = {
  ElectronApp: Symbol.for("ElectronApp"),
  IpcHandlerService: Symbol.for("IpcHandlerService"),
  Controller: Symbol.for("Controller"),
  // repository
  VideoRepository: Symbol.for("VideoRepository"),
  FavoriteRepository: Symbol.for("FavoriteRepository"),
  ConversionRepository: Symbol.for("ConversionRepository"),
  // windows
  BrowserWindow: Symbol.for("BrowserWindow"),
  MainWindow: Symbol.for("MainWindow"),
  PlayerWindow: Symbol.for("PlayerWindow"),
  // services
  WebviewService: Symbol.for("WebviewService"),
  TaskQueueService: Symbol.for("TaskQueueService"),
  DownloaderService: Symbol.for("DownloaderService"),
  SessionService: Symbol.for("SessionService"),
  ProtocolService: Symbol.for("ProtocolService"),
  VideoService: Symbol.for("VideoService"),
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

export interface DownloadContext {
  // Whether it is live
  isLive: boolean;
  // Download progress
  percent: string;
  // Download speed
  speed: string;
  // Ready
  ready: boolean;
}

export interface ExecOptions {
  binPath: string;
  args: string[];
  abortSignal: AbortController;
  encoding?: string;
  onMessage?: (ctx: DownloadContext, message: string) => void;
}
