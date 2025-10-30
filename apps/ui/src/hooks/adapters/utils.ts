const eventMap = new Map();
import { nanoid } from "nanoid";

export const getIpcId = (func: any) => {
  let id = "";
  if (eventMap.get(func)) {
    id = eventMap.get(func);
  } else {
    id = nanoid();
    eventMap.set(func, id);
  }
  return id;
};

export interface IpcListener {
  addIpcListener: (eventName: string, func: any) => void;
  removeIpcListener: (eventName: string, func: any) => void;
}
