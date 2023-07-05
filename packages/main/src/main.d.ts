import { Video, Rectangle } from "electron";
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

declare interface BrowserWindowInitialVal {
  url?: string;
  sourceList?: WebSource[];
}

declare interface ElectronAPI {
  getEnvPath: () => Promise<EnvPath>;
  getFavorites: () => Promise<Favorite>;
  addFavorite: (favorite: Favorite) => Promise<Favorite>;
  removeFavorite: (id: number) => Promise<void>;
  setWebviewBounds: (rect: Electron.Rectangle) => Promise<void>;
  webviewLoadURL: (url?: string) => Promise<void>;
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
  startDownload: (vid: number) => Promise<void>;
  openUrl: (url: string) => Promise<void>;
  stopDownload: (id: number) => Promise<void>;
  onDownloadListContextMenu: (id: number) => Promise<void>;
  onFavoriteItemContextMenu: (id: number) => Promise<void>;
  deleteDownloadItem: (id: number) => Promise<void>;
  convertToAudio: (id: number) => Promise<void>;
  rendererEvent: (channel: string, funcId: string, listener: any) => void;
  removeEventListener: (channel: string, funcId: string) => void;
  showBrowserWindow: () => Promise<void>;
  webviewHide: () => Promise<void>;
  webviewShow: () => Promise<void>;
  downloadNow: (video: DownloadItem) => Promise<void>;
  combineToHomePage: (initialVal: BrowserStore) => Promise<void>;
  editDownloadItem: (video: DownloadItem) => Promise<void>;
  openPlayerWindow: (videoId: number) => Promise<void>;
  getLocalIP: () => Promise<string>;
  openBrowser: (url: string) => Promise<void>;
  getSharedState: () => Promise<any>;
  setSharedState: (state: any) => Promise<void>;
  setUserAgent: (isMobile: boolean) => Promise<void>;
}

declare interface WebSource {
  url: string;
  name: string;
  headers: string;
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
  // 下载完成后删除原始文件
  deleteSegments: boolean;
  // 新窗口打开浏览器
  openInNewWindow: boolean;
  mainBounds?: Rectangle;
  browserBounds?: Rectangle;
  blockAds: boolean;
  // 主题
  theme: "system" | "light" | "dark";
  // 使用浏览器插件
  useExtension: boolean;
  // 是否使用手机UA
  isMobile: boolean;
  // 最大同时下载数
  maxRunner: number;
}

declare interface BrowserStore {
  url: string;
  sourceList: WebSource[];
}
