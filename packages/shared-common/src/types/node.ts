// Type definitions for node-specific types
import type { DownloadType, AppTheme, AppLanguage } from "./index";

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
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface AppStore {
  local: string;
  promptTone: boolean;
  proxy: string;
  useProxy: boolean;
  deleteSegments: boolean;
  openInNewWindow: boolean;
  mainBounds?: Rectangle;
  browserBounds?: Rectangle;
  blockAds: boolean;
  theme: AppTheme;
  useExtension: boolean;
  isMobile: boolean;
  maxRunner: number;
  language: AppLanguage;
  showTerminal: boolean;
  privacy: boolean;
  machineId: string;
  downloadProxySwitch: boolean;
  autoUpgrade: boolean;
  allowBeta: boolean;
  closeMainWindow: boolean;
  audioMuted: boolean;
  enableDocker: boolean;
  dockerUrl: string;
}

export interface BrowserStore {
  url: string;
  sourceList: WebSource[];
}