declare interface EnvPath {
  binPath: string;
  dbPath: string;
  workspace: string;
  platform: string;
  local: string;
}

declare interface DownloadItem {
  id: number;
  name: string;
  url: string;
  status: string;
}

declare interface VideoResponse {
  total: number;
  list: DownloadItem[];
}

declare interface DownloadItemPagination {
  current?: number;
  pageSize?: number;
  filter?: string;
}

declare interface ElectronAPI {
  getEnvPath: () => Promise<EnvPath>;
  addFavorite: (favorite: Omit<Favorite, "id">) => Promise<Favorite>;
  removeFavorite: (id: number) => Promise<void>;
  getFavorites: () => Promise<Favorite[]>;
  setWebviewBounds: (bounds: any) => Promise<void>;
  webviewLoadURL: (url?: string) => Promise<void>;
  webviewGoBack: () => Promise<boolean>;
  webviewReload: () => Promise<void>;
  webwiewGoHome: () => Promise<void>;
  getAppStore: () => Promise<AppStore>;
  onSelectDownloadDir: () => Promise<string>;
  setAppStore: (key: keyof AppStore, val: any) => Promise<void>;
  openDir: (dir: string) => Promise<void>;
  addDownloadItem: (DownloadItem) => Promise<DownloadItem>;
  getDownloadItems: (
    pagination: DownloadItemPagination
  ) => Promise<VideoResponse>;
  startDownload: (vid: number) => Promise<void>;
  openUrl: (url: string) => Promise<void>;
  stopDownload: (id: number) => Promise<void>;
  onDownloadListContextMenu: (id: number) => Promise<void>;
  onFavoriteItemContextMenu: (id: number) => Promise<void>;
  deleteDownloadItem: (id: number) => Promise<void>;
  convertToAudio: (id: number) => Promise<void>;
  rendererEvent: (channel: string, listener: any) => void;
  removeEventListener: (channel: string, listener: any) => void;
}

declare interface Favorite {
  id: number;
  title: string;
  url: string;
  icon?: string;
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
  proxy?: string;
  // 是否开启代理
  useProxy?: boolean;
  // 下载完成后删除原始文件
  deleteSegments?: boolean;
}

declare interface DownloadProgress {
  id: number;
  cur: string;
  total: string;
  speed: string;
}

interface ObjectConstructor {
  keys<T>(o: T): (keyof T)[];
}
