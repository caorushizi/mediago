import { Conversion } from "./entity/Conversion.ts";
import { Video } from "./entity/Video.ts";

export type Controller = Record<string | symbol, any>;

export interface DownloadItem {
  id: number;
  type: DownloadType;
  name: string;
  url: string;
  headers?: string;
  status?: DownloadStatus;
  isLive?: boolean;
}

export enum DownloadFilter {
  list = "list",
  done = "done",
}

export interface DownloadItemPagination {
  current?: number;
  pageSize?: number;
  filter?: DownloadFilter;
}

export interface ConversionPagination {
  current?: number;
  pageSize?: number;
}

export interface VideoResponse {
  total: number;
  list: DownloadItem[];
}

export interface ConversionResponse {
  total: number;
  list: Conversion[];
}

export enum DownloadStatus {
  Ready = "ready",
  Watting = "watting",
  Downloading = "downloading",
  Stopped = "stopped",
  Success = "success",
  Failed = "failed",
}

export type Task = {
  id: number;
  params: Omit<DownloadParams, "id" | "abortSignal" | "callback">;
};

export interface DownloadProgress {
  id: number;
  type: string;
  percent: string;
  speed: string;
  isLive: boolean;
}

export enum DownloadType {
  m3u8 = "m3u8",
  bilibili = "bilibili",
}
export interface DownloadParams {
  id: number;
  type: DownloadType;
  url: string;
  local: string;
  name: string;
  headers?: string;
  abortSignal: AbortController;
  proxy?: string;
  deleteSegments?: boolean;
  callback: (progress: DownloadProgress) => void;
}

export interface VideoStat extends Video {
  exists?: boolean;
  file?: string;
}

export interface ListPagination {
  total: number;
  list: VideoStat[];
}
