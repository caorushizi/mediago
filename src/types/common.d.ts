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

export { SourceUrl, Fav, SourceItem, SourceItemForm };
