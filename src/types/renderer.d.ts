interface TdApp {
  onEvent: (eventId: string, label: string, mapKv: any) => void;
}

interface ElectronIs {
  readonly macos: boolean;
  readonly linux: boolean;
  readonly windows: boolean;
  readonly main: boolean;
  readonly renderer: boolean;
  readonly usingAsar: boolean;
  readonly development: boolean;
  readonly macAppStore: boolean;
  readonly windowsStore: boolean;
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

interface IpcRendererResp {
  code: number;
  msg: string;
  data: any;
}

interface BrowserViewRect {
  x: number;
  y: number;
  height: number;
  width: number;
}

interface ElectronApi {
  store: {
    get: (key?: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  is: ElectronIs;
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
  request: <T>(options: RequestOptions) => Promise<RequestResponse<T>>;
}

declare interface Window {
  electron: Readonly<ElectronApi>;
  TDAPP: TdApp;
}

declare type RequestMethod = "GET" | "get" | "POST" | "post";

declare type RequestHeaders = Record<string, string>;

declare interface RequestOptions {
  baseURL?: string;
  url?: string;
  method?: RequestMethod;
  headers?: RequestHeaders;
  data?: any;
  params?: any;
}

declare interface RequestResponse<T> {
  statusCode: number;
  statusMessage: string;
  data: T;
  headers: Record<string, string | string[]>;
}

declare interface AppStore {
  workspace: string;
  tip: boolean;
  proxy: string;
  useProxy: boolean;
  exeFile: string;
}

declare interface Manifest {
  allowCache: boolean;
  endList: boolean;
  mediaSequence: number;
  discontinuitySequence: number;
  playlistType: string;
  custom: Record<string, unknown>;
  playlists: [
    {
      attributes: Record<string, unknown>;
      Manifest: Manifest;
    }
  ];
  mediaGroups: {
    AUDIO: {
      "GROUP-ID": {
        NAME: {
          default: boolean;
          autoselect: boolean;
          language: string;
          uri: string;
          instreamId: string;
          characteristics: string;
          forced: boolean;
        };
      };
    };
    VIDEO: Record<string, unknown>;
    "CLOSED-CAPTIONS": Record<string, unknown>;
    SUBTITLES: Record<string, unknown>;
  };
  dateTimeString: string;
  dateTimeObject: Date;
  targetDuration: number;
  totalDuration: number;
  discontinuityStarts: [number];
  segments: [
    {
      byterange: {
        length: number;
        offset: number;
      };
      duration: number;
      attributes: Record<string, unknown>;
      discontinuity: number;
      uri: string;
      timeline: number;
      key: {
        method: string;
        uri: string;
        iv: string;
      };
      map: {
        uri: string;
        byterange: {
          length: number;
          offset: number;
        };
      };
      "cue-out": string;
      "cue-out-cont": string;
      "cue-in": string;
      custom: Record<string, unknown>;
    }
  ];
}
