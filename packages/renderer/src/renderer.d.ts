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
  // 新窗口打开浏览器
  openInNewWindow?: boolean;
  // 是否阻止广告
  blockAds?: boolean;
  // 主题
  theme?: AppTheme;
  // 是否使用扩展
  useExtension?: boolean;
  // 默认使用移动端UA
  isMobile?: boolean;
  // 最大同时下载数
  maxRunner?: number;
  // 语言
  language?: AppLanguage;
  // 是否显示终端
  showTerminal?: boolean;
  // 隐私模式
  privacy?: boolean;
  // 机器id
  machineId?: string;
  // 下载代理设置
  downloadProxySwitch?: boolean;
  // 自动更新
  autoUpgrade?: boolean;
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
