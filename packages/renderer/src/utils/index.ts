import dayjs from "dayjs";
import { isUrl } from "./url";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export { http } from "./http";
export { tdApp } from "./tdapp";

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

export function getFileName(url: string) {
  const urlObject = new URL(url);
  const name = urlObject.pathname.split("/").pop() || "";
  return decodeURIComponent(name);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
