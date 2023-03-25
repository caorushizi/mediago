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
}

declare interface VideoResponse {
  total: number;
  list: DownloadItem[];
}

declare interface DownloadItemPagination {
  page?: number;
  pageSize?: number;
}

declare interface ElectronAPI {
  getEnvPath: () => Promise<EnvPath>;
  rendererEvent: (channel: string, listener: any) => void;
  removeEventListener: (channel: string, listener: any) => void;
  addFavorite: (favorite: Favorite) => Promise<Favorite>;
  removeFavorite: (url: string) => Promise<void>;
  getFavorites: () => Promise<Favorite[]>;
  setWebviewBounds: (bounds: any) => void;
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
}

declare interface Favorite {
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
}
