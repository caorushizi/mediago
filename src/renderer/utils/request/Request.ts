import mergeConfig from "./utils";

type RequestPromise<T = any> = Promise<RequestResponse<T>>;

const request = window.electron.request;

export default class Request {
  defaults: RequestOptions;

  constructor(initConfig: RequestOptions) {
    this.defaults = initConfig;
  }

  request<T>(url: any, config?: any): RequestPromise {
    if (typeof url === "string") {
      if (!config) config = {};
      config.url = url;
    } else {
      config = url;
    }

    config = mergeConfig(this.defaults, config);
    config.method = config.method.toLowerCase();

    return request(config);
  }
}
