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

interface ObjectConstructor {
  keys<T>(o: T): (keyof T)[];
}
