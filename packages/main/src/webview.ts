import { WebSource } from "main";
import { IpcRendererEvent, ipcRenderer } from "electron/renderer";

// 创建浮窗容器元素
const floatingContainer = document.createElement("div");
floatingContainer.style.cssText = `
position: fixed;
bottom: 0;
left: 50%;
transform: translateX(-50%);
width: 200px;
z-index: 10000;
display: none;
font-size: 16px;
`;

// 创建浮窗按钮元素
const floatingButton = document.createElement("div");
floatingButton.textContent = "检测到视频资源……";
floatingButton.style.cssText = `
background-color: #000;
color: #fff;
padding: 10px;
cursor: pointer;
opacity: 0.8;
`;

// 创建浮窗列表元素
const floatingList = document.createElement("ul");
floatingList.style.cssText = `
display: none;
background-color: #000;
list-style: none;
padding: 0;
margin: 0;
`;

const itemStyle = `
padding: 10px;
color: #fff;
cursor: pointer;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
`;

const items: WebSource[] = [];
ipcRenderer.on(
  "webview-link-message",
  (e: IpcRendererEvent, data: WebSource) => {
    floatingContainer.style.display = "block";

    items.push(data);

    // 清空列表
    while (floatingList?.firstChild) {
      floatingList.removeChild(floatingList.firstChild);
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // 创建列表项元素
      const elItem = document.createElement("li");
      elItem.textContent = item.name;
      elItem.title = item.name;
      elItem.style.cssText = itemStyle;
      elItem.addEventListener("click", () => {
        ipcRenderer.invoke("add-download-item", {
          name: data.name,
          url: data.url,
          type: data.type,
        });
      });
      elItem.addEventListener("mouseenter", () => {
        elItem.style.backgroundColor = "#fff";
        elItem.style.color = "#000";
      });
      elItem.addEventListener("mouseleave", () => {
        elItem.style.backgroundColor = "#000";
        elItem.style.color = "#fff";
      });

      // 将列表项添加到浮窗列表
      floatingList.appendChild(elItem);
    }
  }
);

// 将按钮和列表添加到浮窗容器
floatingContainer.appendChild(floatingList);
floatingContainer.appendChild(floatingButton);

// 鼠标进入浮窗按钮时的处理函数
floatingContainer.addEventListener("mouseenter", () => {
  floatingButton.style.opacity = "1";
  floatingList.style.display = "block";
});

// 鼠标离开浮窗按钮时的处理函数
floatingContainer.addEventListener("mouseleave", () => {
  floatingButton.style.opacity = "0.8";
  floatingList.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  // 将浮窗容器添加到body元素
  document.body.appendChild(floatingContainer);
});
