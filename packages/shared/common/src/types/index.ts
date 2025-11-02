import type { Conversion, Favorite, Video } from "./entities";

export type Controller = Record<string | symbol, any>;

export interface DownloadTask {
  id: number;
  type: DownloadType;
  name: string;
  url: string;
  headers?: string;
  status?: DownloadStatus;
  folder?: string;
  isLive?: boolean;
  createdDate?: Date;
}

export enum DownloadFilter {
  list = "list",
  done = "done",
}

export interface DownloadTaskPagination {
  current?: number;
  pageSize?: number;
  filter?: DownloadFilter;
}

export interface ConversionPagination {
  current?: number;
  pageSize?: number;
}

export interface DownloadTaskResponse {
  total: number;
  list: DownloadTaskWithFile[];
}

export interface ConversionResponse {
  total: number;
  list: Conversion[];
}

export enum DownloadStatus {
  Ready = "ready",
  Watting = "watting",
  Downloading = "downloading",
  Stopped = "stopped",
  Success = "success",
  Failed = "failed",
}

export type Task = {
  id: number;
  params: Omit<DownloadParams, "id" | "abortSignal" | "callback">;
};

export interface DownloadProgress {
  id: number;
  type: string;
  percent: string;
  speed: string;
  isLive: boolean;
  status: DownloadStatus;
}

export enum DownloadType {
  m3u8 = "m3u8",
  bilibili = "bilibili",
  direct = "direct",
}

export interface DownloadParams {
  id: number;
  type: DownloadType;
  url: string;
  local: string;
  name: string;
  headers?: string;
  abortSignal: AbortController;
  proxy?: string;
  deleteSegments?: boolean;
  callback: (type: string, data: any) => void;
  folder?: string;
}

export interface DownloadTaskWithFile extends DownloadTask {
  exists?: boolean;
  file?: string;
}

export interface ListPagination {
  total: number;
  list: DownloadTaskWithFile[];
}

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

/**
 * Platform
 */
export enum Platform {
  Windows = "win32",
  MacOS = "darwin",
  Linux = "linux",
}

export interface DownloadEvent<T = any> {
  type: string;
  data: T;
}

export interface DownloadSuccessEvent extends DownloadEvent<DownloadTask> {
  type: "success";
}

export interface DownloadFailedData {
  id: number;
  error: string;
}

export interface DownloadFailedEvent extends DownloadEvent<DownloadFailedData> {
  type: "failed";
}

export interface DownloadProgressEvent
  extends DownloadEvent<DownloadProgress[]> {
  type: "progress";
}

export interface EnvPath {
  binPath: string;
  dbPath: string;
  workspace: string;
  platform: string;
  local: string;
  playerUrl: string;
}

export interface Rectangle {
  height: number;
  width: number;
  x: number;
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
  // Mobile player
  enableMobilePlayer: boolean;
  // server apikey
  apiKey: string;
}

export interface WebSource {
  url: string;
  type: DownloadType;
  name: string;
  headers?: string;
}

export interface BrowserStore {
  url: string;
  sourceList: WebSource[];
}

export interface SetupAuthRequest {
  apiKey: string;
}

export interface IS_SETUP_RESPONSE {
  setuped: boolean;
}

export interface MediaGoApi {
  getEnvPath(): Promise<EnvPath>;
  getFavorites(): Promise<Favorite[]>;
  addFavorite(
    favorite: Omit<Favorite, "id" | "createdDate" | "updatedDate">,
  ): Promise<Favorite>;
  removeFavorite(id: number): Promise<void>;
  setWebviewBounds(rect: Rectangle): Promise<void>;
  webviewGoBack(): Promise<boolean>;
  webviewReload(): Promise<void>;
  webviewLoadURL(url?: string): Promise<void>;
  webviewGoHome(): Promise<void>;
  getAppStore(): Promise<AppStore>;
  onSelectDownloadDir(): Promise<string>;
  setAppStore(
    key: keyof AppStore,
    val: AppStore[keyof AppStore],
  ): Promise<void>;
  openDir(dir?: string): Promise<void>;
  createDownloadTasks(
    tasks: Omit<DownloadTask, "id">[],
    startDownload?: boolean,
  ): Promise<Video[]>;
  getDownloadTasks(p: DownloadTaskPagination): Promise<DownloadTaskResponse>;
  startDownload(vid: number): Promise<void>;
  openUrl(url: string): Promise<void>;
  stopDownload(id: number): Promise<void>;
  onDownloadListContextMenu(id: number): Promise<void>;
  onFavoriteItemContextMenu(id: number): Promise<void>;
  deleteDownloadTask(id: number): Promise<void>;
  convertToAudio(id: number): Promise<void>;
  rendererEvent(
    channel: string,
    funcId: string,
    listener: (...args: unknown[]) => void, // More specific than 'any'
  ): void;
  removeEventListener(channel: string, funcId: string): void;
  showBrowserWindow(): Promise<void>;
  webviewHide(): Promise<void>;
  webviewShow(): Promise<void>;
  appContextMenu(): Promise<void>;
  combineToHomePage(store: BrowserStore): Promise<void>;
  updateDownloadTask(
    task: DownloadTask,
    startDownload?: boolean,
  ): Promise<void>;
  getLocalIP(): Promise<string>;
  openBrowser(url: string): Promise<void>;
  selectFile(): Promise<string>;
  getSharedState(): Promise<unknown>; // Use 'unknown' for better type safety than 'any'
  setSharedState(state: unknown): Promise<void>; // Use 'unknown'
  setUserAgent(isMobile: boolean): Promise<void>;
  getDownloadLog(id: number): Promise<string>;
  showDownloadDialog(data: Omit<DownloadTask, "id">[]): Promise<unknown>; // Result depends on main process handler
  pluginReady(): Promise<void>;
  getConversions(pagination: ConversionPagination): Promise<ConversionResponse>;
  addConversion(conversion: Omit<Conversion, "id">): Promise<Conversion>;
  deleteConversion(id: number): Promise<void>;
  getMachineId(): Promise<string>;
  clearWebviewCache(): Promise<void>;
  exportFavorites(): Promise<void>;
  importFavorites(): Promise<void>;
  checkUpdate(): Promise<void>;
  startUpdate(): Promise<void>;
  installUpdate(): Promise<void>;
  exportDownloadList(): Promise<void>;
  getVideoFolders(): Promise<string[]>;
  getPageTitle(url: string): Promise<string | undefined>;
  setupAuth(req: SetupAuthRequest): Promise<void>;
  signin(req: SetupAuthRequest): Promise<void>;
  isSetup(): Promise<IS_SETUP_RESPONSE>;
}
