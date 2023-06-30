import { ipcRenderer } from "electron";

const root = document.createElement("div");
root.id = "MediaDownloaderRoot";

ipcRenderer.on("webview-link-message", (e: any, data: any) => {
  const item = document.createElement("div");
  item.innerText = data.title;
  item.addEventListener("click", () => {
    ipcRenderer.invoke("add-download-item", {
      name: data.title,
      url: data.url,
    });
  });
  root.appendChild(item);
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.appendChild(root);
});
