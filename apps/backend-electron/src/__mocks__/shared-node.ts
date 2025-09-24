import type { AppLanguage, AppTheme } from "@mediago/shared-common";

export interface EnvPath {
  binPath: string;
  dbPath: string;
  workspace: string;
  platform: string;
  local: string;
}

export interface Favorite {
  id: number;
  name: string;
  url: string;
}

export interface AppStore {
  local: string;
  promptTone: boolean;
  proxy: string;
  useProxy: boolean;
  deleteSegments: boolean;
  openInNewWindow: boolean;
  mainBounds?: unknown;
  browserBounds?: unknown;
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

export class ConversionRepository {}

export class DownloadManagementService {}

export class FavoriteManagementService {
  getFavorites(): Favorite[] {
    return [];
  }

  addFavorite(_favorite: Favorite): Favorite {
    return _favorite;
  }

  removeFavorite(_id: number): Promise<void> {
    return Promise.resolve();
  }
}

export class TaskQueueService {
  on(_event: string, _listener: (...args: unknown[]) => void): void {}
}

export class VideoRepository {}

export const TYPES = {
  Controller: Symbol("Controller"),
  ConversionService: Symbol("ConversionService"),
  DownloadManagementService: Symbol("DownloadManagementService"),
  FavoriteManagementService: Symbol("FavoriteManagementService"),
} as const;

export function handle(_channel: string) {
  return () => {
    // no-op decorator for tests
  };
}
