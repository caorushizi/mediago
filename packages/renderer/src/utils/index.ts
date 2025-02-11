import dayjs from "dayjs";
import { isUrl } from "./url";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";
import { DownloadType } from "@/types";

export { http, api } from "./http";
export { tdApp } from "./tdapp";
export { getSocket } from "./socket";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

export const requestImage = (url: string, timeout = 1000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const handleError = () => {
      img.src = "";
      reject();
    };
    const timer = setTimeout(handleError, timeout);
    const handleOnLoad = () => {
      clearTimeout(timer);
      resolve();
    };
    img.onerror = handleError;
    img.onload = handleOnLoad;
    img.src = url;
  });
};

export const getFavIcon = async (url: string) => {
  let iconUrl = "";
  try {
    const urlObject = new URL(url);
    const fetchUrl = urlObject.origin ? `${urlObject.origin}/favicon.ico` : "";
    await requestImage(fetchUrl);
    iconUrl = fetchUrl;
  } catch (e) {
    // empty
  }
  return iconUrl;
};

export const generateUrl = (url: string) => {
  let result = url;
  if (!/^https?:\/\//.test(url)) {
    result = `http://${url}`;
  }
  if (!isUrl(result)) {
    result = `https://www.baidu.com/s?word=${url}`;
  }
  return result;
};

export function moment() {
  return dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
}

export function fromatDateTime(
  d: string | number | Date,
  tmpStr: string = "YYYY/MM/DD HH:mm:ss",
) {
  return dayjs(d).format(tmpStr);
}

export function getFileName(url: string) {
  const urlObject = new URL(url);
  const name = urlObject.pathname.split("/").pop() || "";
  return decodeURIComponent(name);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function randomName() {
  return dayjs().format("YYYYMMDD") + "-" + nanoid();
}

export const isWeb = import.meta.env.APP_TARGET === "web";

export function isDownloadType(value: string): value is DownloadType {
  return Object.values(DownloadType).includes(value as DownloadType);
}

export const urlDownloadType = (url: string): DownloadType => {
  if (url.includes("bilibili")) {
    return DownloadType.bilibili;
  }
  if (url.includes("m3u8")) {
    return DownloadType.m3u8;
  }
  return DownloadType.direct;
};

export const convertPlainObject = (obj: unknown) => {
  return JSON.parse(JSON.stringify(obj));
};
