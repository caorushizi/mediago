declare interface EnvPath {
  binPath: string;
  dbPath: string;
  workspace: string;
  platform: string;
  local: string;
}

declare interface DownloadItem {
  id: number;
  type: DownloadType;
  name: string;
  url: string;
  headers?: string;
  status?: DownloadStatus;
  isLive?: boolean;
  log?: string;
  folder?: string;
  createdDate?: string;
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

declare interface Favorite {
  id: number;
  title: string;
  url: string;
  icon?: string;
}

declare interface WebSource {
  url: string;
  name: string;
  headers: string;
}

declare interface UrlDetail {
  url: string;
  title: string;
}

declare interface AppStore {
  // Local storage address
  local: string;
  // Download completion tone
  promptTone: boolean;
  // Proxy address
  proxy?: string;
  // Whether to enable agent
  useProxy?: boolean;
  // Delete the original file after downloading
  deleteSegments?: boolean;
  // A new window opens the browser
  openInNewWindow?: boolean;
  // Whether to block ads
  blockAds?: boolean;
  // theme
  theme?: AppTheme;
  // Whether to use extensions
  useExtension?: boolean;
  // The mobile UA is used by default
  isMobile?: boolean;
  // Maximum number of simultaneous downloads
  maxRunner?: number;
  // Language
  language?: AppLanguage;
  // Show terminal or not
  showTerminal?: boolean;
  // Privacy mode
  privacy?: boolean;
  // Machine id
  machineId?: string;
  // Download proxy Settings
  downloadProxySwitch?: boolean;
  // Automatic update
  autoUpgrade?: boolean;
  // Whether to play sounds in the browser. The default value is mute
  audioMuted?: boolean;
  // Whether to enable Docker
  enableDocker?: boolean;
  // Docker URL
  dockerUrl?: string;
}

declare interface BrowserStore {
  mode: PageMode;
  url: string;
  title: string;
  status: BrowserStatus;
  errCode?: number;
  errMsg?: string;
  sources: SourceData[];
}

declare interface DownloadProgress {
  id: number;
  speed: string;
  percent: string;
  isLive: boolean;
}

interface ObjectConstructor {
  keys<T>(o: T): (keyof T)[];
}

interface VideoStat extends DownloadItem {
  exists?: boolean;
  file?: string;
}

interface ListPagination {
  total: number;
  list: VideoStat[];
}
