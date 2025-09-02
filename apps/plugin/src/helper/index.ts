import { nanoid } from "nanoid";
import { DownloadItem } from "@mediago/shared/common";

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

export interface Item {
  name: string;
  url: string;
  type: any;
}

export function showDownloadDialog(item: Omit<DownloadItem, "id">[]) {
  window.electron.showDownloadDialog(item);
}

// Notifies the main process that the plug-in is ready
export function pluginReady() {
  window.electron.pluginReady();
}

export const BILIBILI_DOWNLOAD_BUTTON = ".bili-video-card__image--link";
