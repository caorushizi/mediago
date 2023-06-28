let imageUrls: string[] = [];

console.log("123123");

chrome.webRequest.onCompleted.addListener(
  function (details) {
    console.log("123123123123123", details.type);
    if (details.type === "image") {
      imageUrls.push(details.url);
      console.log("图片资源URL: " + details.url);
    }
  },
  { urls: ["<all_urls>"] }
);

// // 注入脚本到页面
// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   if (changeInfo.status == "complete") {
//     chrome.tabs.executeScript(tabId, { file: "content.js" });
//   }
// });

// 使用消息传递API发送捕获的图片URL到content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "getImageUrls") {
    sendResponse({ imageUrls: imageUrls });
    // 清空已捕获的图片URL
    imageUrls = [];
  }
});
