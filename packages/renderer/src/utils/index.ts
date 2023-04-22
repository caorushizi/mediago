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
