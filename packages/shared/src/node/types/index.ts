import {
  AppLanguage,
  AppTheme,
  DownloadType,
} from "../../common/types/index.ts";

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
  // vendor electron
  ElectronLogger: Symbol.for("ElectronLogger"),
  ElectronUpdater: Symbol.for("ElectronUpdater"),
  ElectronStore: Symbol.for("ElectronStore"),
  ElectronDevtools: Symbol.for("ElectronDevtools"),
  // vendor web
  SocketIO: Symbol.for("SocketIO"),
  Logger: Symbol.for("Logger"),
  StoreService: Symbol.for("StoreService"),
  RouterHandlerService: Symbol.for("RouterHandlerService"),
  // vendor typeorm
  TypeORM: Symbol.for("TypeORM"),
};

export interface EnvPath {
  binPath: string;
  dbPath: string;
  workspace: string;
  platform: string;
  local: string;
}

export interface BrowserWindowInitialVal {
  url?: string;
  sourceList?: WebSource[];
}

export interface WebSource {
  url: string;
  type: DownloadType;
  name: string;
  headers?: string;
}

export interface Rectangle {
  // Docs: https://electronjs.org/docs/api/structures/rectangle

  /**
   * The height of the rectangle (must be an integer).
   */
  height: number;
  /**
   * The width of the rectangle (must be an integer).
   */
  width: number;
  /**
   * The x coordinate of the origin of the rectangle (must be an integer).
   */
  x: number;
  /**
   * The y coordinate of the origin of the rectangle (must be an integer).
   */
  y: number;
}

export interface AppStore {
  // Local storage address
  local: string;
  // Download completion tone
  promptTone: boolean;
  // Proxy address
  proxy: string;
  // Whether to enable agent
  useProxy: boolean;
  // Delete the original file after downloading
  deleteSegments: boolean;
  // A new window opens the browser
  openInNewWindow: boolean;
  mainBounds?: Rectangle;
  browserBounds?: Rectangle;
  blockAds: boolean;
  // theme
  theme: AppTheme;
  // Using browser plugins
  useExtension: boolean;
  // Whether to use mobile UA
  isMobile: boolean;
  // Maximum number of simultaneous downloads
  maxRunner: number;
  // Language
  language: AppLanguage;
  // Show terminal or not
  showTerminal: boolean;
  // Privacy mode
  privacy: boolean;
  // Machine id
  machineId: string;
  // Download proxy Settings
  downloadProxySwitch: boolean;
  // Automatic update
  autoUpgrade: boolean;
  // beta versions are allowed
  allowBeta: boolean;
  // Close the main window
  closeMainWindow: boolean;
  // Whether to play sounds in the browser. The default value is mute
  audioMuted: boolean;
  // Whether to enable Docker
  enableDocker: boolean;
  // Docker URL
  dockerUrl: string;
}

export interface BrowserStore {
  url: string;
  sourceList: WebSource[];
}

/**
 * Download schema
 */
export interface DownloadSchema {
  args: Record<string, Args>;
  consoleReg: {
    percent: string;
    speed: string;
    error: string;
    start: string;
    isLive: string;
  };
  platform: string[];
  type: string;
}

export interface Args {
  argsName: string[] | null;
  postfix?: string;
}

export interface RunnerOptions<T> {
  abortController: AbortController;
  onMessage: (ctx: T, data: string) => void;
  binPath: string;
  args: string[];
  ctx: T;
}
