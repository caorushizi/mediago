export { registerControllerHandlers } from "./registerControllerHandlers";
export type { ControllerHandlerBinder, ControllerHandlerRegistration } from "./registerControllerHandlers";

import { MEDIAGO_EVENT, MEDIAGO_METHOD } from "@mediago/shared-common";

export const handle = (route: string) => {
  return (target: any, propertyName: string): void => {
    Reflect.defineMetadata(MEDIAGO_METHOD, "handle", target, propertyName);
    Reflect.defineMetadata(MEDIAGO_EVENT, route, target, propertyName);
  };
};
