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

function createInstance(config: RequestOptions): any {
  const context = new Request(config);
  const instance = Request.prototype.request.bind(context);

  extend(instance, context);

  return instance;
}

const request = createInstance(defaults);

export default request;
