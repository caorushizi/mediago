import { ipcMain } from "electron";

export function handle(route: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ): void {
    const method = descriptor.value;
    console.log("route", route);
    ipcMain.handle(route, method, this);
  };
}

export function on(route: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<any>
  ): void {
    const method = descriptor.value;
    console.log("route", route, method.prototype);
    ipcMain.on(route, method);
  };
}
