import { MEDIAGO_EVENT, MEDIAGO_METHOD } from "../../common";

export const handle = (route: string) => {
  return (target: any, propertyName: string): void => {
    Reflect.defineMetadata(MEDIAGO_METHOD, "handle", target, propertyName);
    Reflect.defineMetadata(MEDIAGO_EVENT, route, target, propertyName);
  };
};
