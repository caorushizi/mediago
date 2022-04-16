import Request from "./Request";

const defaults: RequestOptions = {
  method: "get",
};

export function extend<T, U>(to: T, from: U): T & U {
  for (const key in from) {
    (to as T & U)[key] = from[key] as any;
  }
  return to as T & U;
}

type RequestInstance = {
  <T>(options: RequestOptions): Promise<RequestResponse<T>>;
  <T>(url: string): Promise<RequestResponse<T>>;
};

function createInstance(config: RequestOptions): RequestInstance {
  const context = new Request(config);
  const instance = Request.prototype.request.bind(context);

  extend(instance, context);

  return instance;
}

const request = createInstance(defaults);

export default request;
