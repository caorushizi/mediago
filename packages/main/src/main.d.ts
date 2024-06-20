import { Rectangle } from "electron";
import { type DownloadType } from "interfaces";
import { AppLanguage, AppTheme } from "./types";

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

declare interface WebSource {
  url: string;
  type: DownloadType;
  name: string;
  headers?: string;
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
  theme: AppTheme;
  // 使用浏览器插件
  useExtension: boolean;
  // 是否使用手机UA
  isMobile: boolean;
  // 最大同时下载数
  maxRunner: number;
  // 语言
  language: AppLanguage;
  // 是否显示终端
  showTerminal: boolean;
  // 隐私模式
  privacy: boolean;
  // 机器id
  machineId: string;
}

declare interface BrowserStore {
  url: string;
  sourceList: WebSource[];
}
