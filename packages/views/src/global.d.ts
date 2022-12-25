declare interface SourceUrl {
  id: string;
  name: string;
  duration: number;
  url: string;
  headers?: Record<string, string>;
}

declare type SourceStatus = "ready" | "downloading" | "failed" | "success";
declare type SourceType = "m3u8" | "m4s";

declare type SourceItem = SourceUrl & {
  status: SourceStatus;
  type: SourceType;
  deleteSegments: boolean;
  directory: string;
  createdAt: number;
  exeFile: string;
  // 额外字段
  checkbox?: string[];
  maxThreads?: number;
  minThreads?: number;
  retryCount?: number;
  timeOut?: number;
  stopSpeed?: number;
  maxSpeed?: number;
};

declare interface Fav {
  id: string;
  url: string;
  title: string;
}

declare interface SourceItemForm {
  name: string;
  url: string;
  headers?: string;
  delete: boolean;
}

// M3u8DL 全部参数
declare interface M3u8DLArgs {
  url: string; // 视频地址
  workDir: string; // 设定程序工作目录
  saveName: string; // 设定存储文件名(不包括后缀)
  baseUrl?: string; // 设定Baseurl
  headers?: string; // 设定请求头，格式 key:value 使用|分割不同的key&value
  maxThreads?: number; // 设定程序的最大线程数(默认为32)
  minThreads?: number; // 设定程序的最小线程数(默认为16)
  retryCount?: number; // 设定程序的重试次数(默认为15)
  timeOut?: number; // 设定程序网络请求的超时时间(单位为秒，默认为10秒)
  muxSetJson?: string; // 使用外部json文件定义混流选项
  useKeyFile?: string; // 使用外部16字节文件定义AES-128解密KEY
  useKeyBase64?: string; // 使用Base64字符串定义AES-128解密KEY
  useKeyIV?: string; // 使用HEX字符串定义AES-128解密IV
  downloadRange?: string; // 仅下载视频的一部分分片或长度
  liveRecDur?: string; // 直播录制时，达到此长度自动退出软件
  stopSpeed?: number; // 当速度低于此值时，重试(单位为KB/s)
  maxSpeed?: number; // 设置下载速度上限(单位为KB/s)
  proxyAddress?: string; // 设置HTTP代理, 如 http://127.0.0.1:8080
  enableDelAfterDone?: boolean; // 开启下载后删除临时文件夹的功能
  enableMuxFastStart?: boolean; // 开启混流mp4的FastStart特性
  enableBinaryMerge?: boolean; // 开启二进制合并分片
  enableParseOnly?: boolean; // 开启仅解析模式(程序只进行到meta.json)
  enableAudioOnly?: boolean; // 合并时仅封装音频轨道
  disableDateInfo?: boolean; // 关闭混流中的日期写入
  noMerge?: boolean; // 禁用自动合并
  noProxy?: boolean; // 不自动使用系统代理
}

// mediago 全部参数
declare interface MediaGoArgs {
  path: string;
  name: string;
  url: string;
  headers?: string;
}

declare interface VideoDetail {
  segmentsLen: number;
  duration: number;
}

declare interface IpcResponse {
  code: number;
  msg: string;
  data: any;
}

interface ElectronApi {
  store: {
    get: (key?: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  isWindows: boolean;
  isMacos: boolean;
  ipcExec: (
    exeFile: string,
    args: M3u8DLArgs | MediaGoArgs
  ) => Promise<IpcRendererResp>;
  openBinDir: () => void;
  openConfigDir: () => void;
  openPath: (workspace: string) => Promise<string>;
  openExternal: (
    url: string,
    options?: Electron.OpenExternalOptions
  ) => Promise<void>;
  openBrowserWindow: (url?: string) => void;
  getPath: (name: string) => Promise<string>;
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<any>;
  closeBrowserWindow: () => void;
  getBrowserView: () => Promise<Electron.BrowserView | null>;
  addEventListener: (
    channel: string,
    listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
  ) => void;
  removeEventListener: (
    channel: string,
    listener: (...args: any[]) => void
  ) => void;
  setBrowserViewRect: (rect: BrowserViewRect) => void;
  closeMainWindow: () => void;
  browserViewGoBack: () => void;
  browserViewReload: () => void;
  browserViewLoadURL: (url?: string) => void;
  itemContextMenu: (item: SourceItem) => void;
  minimize: (name: string) => void;
  getVideoList: () => Promise<Video[]>;
  addVideo: (video: Video) => Promise<Video>;
  updateVideo: (id: string, video: Partial<Video>) => Promise<void>;
  removeVideo: (id?: string) => Promise<void>;
  getCollectionList: () => Promise<Collection[]>;
  addCollection: (video: Collection) => Promise<Collection>;
  updateCollection: (id: string, video: Partial<Collection>) => Promise<void>;
  removeCollection: (id?: string) => Promise<void>;
}

declare interface AppStore {
  workspace: string;
  tip: boolean;
  proxy: string;
  useProxy: boolean;
  exeFile: string;
  statistics: boolean; // 是否允许打点统计
}

declare interface Video {
  id?: string;
  name: string;
  url: string;
  headers?: string;
  status: "ready" | "downloading" | "failed" | "success";
  createdDate?: Date;
  updatedDate?: Date;
}
