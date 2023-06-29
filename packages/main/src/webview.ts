import { ipcRenderer } from "electron";

console.log("我已经加载");

ipcRenderer.on("webview-link-message", (e: any, data: any) => {
  console.log("我获取到一条消息", data);
  const item = $(`<div>${data.title}</div>`);
  item.on("click", () => {
    ipcRenderer.invoke("add-download-item", {
      name: data.title,
      url: data.url,
    });
  });
  // $root.append(item);
});

document.addEventListener("DOMContentLoaded", () => {
  const root = document.createElement("div");
  root.id = "MediaDownloaderRoot";

  document.body.appendChild(root);
});
