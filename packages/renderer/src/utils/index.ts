export { http } from "./http";
export { tdApp } from "./tdapp";

export const requestImage = (url: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = resolve;
    img.src = url;
  });
};
