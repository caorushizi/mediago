// 从主进程中想渲染进程发送的参数
import { SourceStatus, SourceType } from "renderer/common/types";

declare interface SourceUrl {
  title: string;
  duration: number;
  url: string;
  headers?: Record<string, string>;
}

declare type SourceItem = SourceUrl & {
  loading: boolean;
  status: SourceStatus;
  type: SourceType;
  directory: string;
  createdAt: number;
};

declare interface Fav {
  url: string;
  title: string;
}

declare interface SourceItemForm {
  title: string;
  url: string;
  headers: string;
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

export { SourceUrl, Fav, SourceItem, SourceItemForm, M3u8DLArgs, MediaGoArgs };
