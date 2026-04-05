import type { DownloadTask } from "@mediago/shared-common";

export function addIpcListener(
  eventName: string,
  func: (...args: unknown[]) => void,
) {
  window.electron.on(eventName, func);
}

export function removeIpcListener(
  eventName: string,
  func: (...args: unknown[]) => void,
) {
  window.electron.off(eventName, func);
}

export interface Item {
  name: string;
  url: string;
  type: any;
}

export function showDownloadDialog(item: Omit<DownloadTask, "id">[]) {
  window.electron.browser.showDownloadDialog(item);
}

// Notifies the main process that the plug-in is ready
export function pluginReady() {
  window.electron.browser.pluginReady();
}

export const BILIBILI_DOWNLOAD_BUTTON = ".bili-video-card__image--link";
