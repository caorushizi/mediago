// 从主进程中想渲染进程发送的参数
import { SourceStatus, SourceType } from "renderer/common/types";

declare interface SourceUrl {
  title: string;
  duration: number;
  details: Electron.OnBeforeSendHeadersListenerDetails;
}

declare type SourceItem = SourceUrl & {
  loading: boolean;
  status: SourceStatus;
  type: SourceType;
};

declare function SourceUrlToRenderer(
  event: Electron.IpcRendererEvent,
  url: SourceUrl
): void;

declare interface Fav {
  url: string;
  title: string;
}

export { SourceUrl, SourceUrlToRenderer, Fav, SourceItem };
