declare interface DownloadTaskResponse {
  total: number;
  list: DownloadTask[];
}

declare interface DownloadTaskPagination {
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

declare interface UrlDetail {
  url: string;
  title: string;
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

interface ListPagination {
  total: number;
  list: DownloadTaskWithFile[];
}
