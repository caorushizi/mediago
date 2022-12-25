export const handle = (route: string) => {
  return (target: any, propertyKey: string): void => {
    Reflect.defineMetadata("ipc-method", "handle", target, propertyKey);
    Reflect.defineMetadata("ipc-channel", route, target, propertyKey);
  };
};

export const on = (route: string) => {
  return (target: any, propertyName: string): void => {
    Reflect.defineMetadata("ipc-method", "on", target, propertyName);
    Reflect.defineMetadata("ipc-channel", route, target, propertyName);
  };
};
