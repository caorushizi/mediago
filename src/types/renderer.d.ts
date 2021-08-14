interface TdApp {
  onEvent: (eventId: string, label: string, mapKv: any) => void;
}

declare interface Window {
  TDAPP: TdApp;
}

declare type RequestMethod = "GET" | "get" | "POST" | "post";

declare type RequestHeaders = Record<string, string>;

declare interface RequestOptions {
  url: string;
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
