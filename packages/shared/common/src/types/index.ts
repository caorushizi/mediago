import type { Conversion } from "./entities";

export type { ElectronApi } from "./electronApi";

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
