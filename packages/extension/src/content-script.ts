// 创建提示元素
const videoIcon = document.createElement("div");
videoIcon.style.position = "fixed";
videoIcon.style.bottom = "20px";
videoIcon.style.right = "20px";
videoIcon.style.width = "40px";
videoIcon.style.height = "40px";
videoIcon.style.backgroundColor = "red";
videoIcon.style.borderRadius = "50%";

// 将提示元素插入到页面中
document.body.appendChild(videoIcon);

// 向背景脚本发送消息，表示存在视频资源
chrome.runtime.sendMessage({ videoFound: true });
