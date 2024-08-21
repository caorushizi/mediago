export const get = (route: string) => {
  return (target: any, propertyKey: string): void => {
    Reflect.defineMetadata("http-method", "get", target, propertyKey);
    Reflect.defineMetadata("router-path", route, target, propertyKey);
  };
};

export const post = (route: string) => {
  return (target: any, propertyName: string): void => {
    Reflect.defineMetadata("http-method", "post", target, propertyName);
    Reflect.defineMetadata("router-path", route, target, propertyName);
  };
};
