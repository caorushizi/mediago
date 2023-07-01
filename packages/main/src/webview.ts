import "./webview.css";
import { LinkMessage } from "main";
import { IpcRendererEvent, ipcRenderer } from "electron/renderer";

const root = document.createElement("div");
root.id = "MediaDownloaderRoot";
ipcRenderer.on(
  "webview-link-message",
  (e: IpcRendererEvent, data: LinkMessage) => {
    const item = document.createElement("div");
    item.className = "video-item";
    item.innerText = data.name;
    item.title = data.name;
    item.addEventListener("click", () => {
      ipcRenderer.invoke("add-download-item", {
        name: data.name,
        url: data.url,
      });
    });
    root.appendChild(item);
  }
);

document.addEventListener("DOMContentLoaded", () => {
  document.body.appendChild(root);
});
