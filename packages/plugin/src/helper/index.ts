import { nanoid } from "nanoid";

export { emitter } from "./events";

const eventMap = new Map();

const getIpcId = (func: any) => {
  let id = "";
  if (eventMap.get(func)) {
    id = eventMap.get(func);
  } else {
    id = nanoid();
    eventMap.set(func, id);
  }
  return id;
};

export function addIpcListener(eventName: string, func: any) {
  const id = getIpcId(func);
  window.electron.rendererEvent(eventName, id, func);
}

export function removeIpcListener(eventName: string, func: any) {
  const id = getIpcId(func);
  window.electron.removeEventListener(eventName, id);
}
