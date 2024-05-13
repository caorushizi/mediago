import { nanoid } from "nanoid";

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

export function downloadItem(item: Item) {
  window.electron.downloadItem(item);
}

export function showDownloadDialog(item: Item) {
  window.electron.showDownloadDialog(item);
}

// 通知主进程插件已经就绪
export function pluginReady() {
  window.electron.pluginReady();
}

export const BILIBILI_DOWNLOAD_BUTTON = ".bili-video-card__image--link";
