import { Video } from "electron";
import { type Favorite } from "entity/Favorite";
import {
  DownloadItem,
  DownloadItemPagination,
  VideoResponse,
} from "interfaces";

declare interface EnvPath {
  binPath: string;
  dbPath: string;
  workspace: string;
  platform: string;
  local: string;
}

declare interface ElectronAPI {
  getEnvPath: () => Promise<EnvPath>;
  rendererEvent: (channel: string, listener: any) => void;
  removeEventListener: (channel: string, listener: any) => void;
  getFavorites: () => Promise<Favorite>;
  addFavorite: (favorite: Favorite) => Promise<Favorite>;
  removeFavorite: (url: string) => Promise<void>;
  setWebviewBounds: (rect: Electron.Rectangle) => void;
  webviewLoadURL: (url?: string) => void;
  webviewGoBack: () => Promise<boolean>;
  webviewReload: () => Promise<void>;
  webwiewGoHome: () => Promise<void>;
  getAppStore: () => Promise<AppStore>;
  onSelectDownloadDir: () => Promise<string>;
  setAppStore: (key: keyof AppStore, val: any) => Promise<void>;
  openDir: (dir: string) => Promise<void>;
  addDownloadItem: (video: DownloadItem) => Promise<Video>;
  getDownloadItems: (
    pagiantion: DownloadItemPagination
  ) => Promise<VideoResponse>;
}

declare interface LinkMessage {
  url: string;
  title: string;
}

declare interface AppStore {
  // 本地存储地址
  local: string;
  // 下载完成提示音
  promptTone: boolean;
  // 代理地址
  proxy: string;
  // 是否开启代理
  useProxy: boolean;
}
