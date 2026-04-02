---
layout: doc
outline: deep
---

# 配合猫爪下载视频

::: tip
感谢 `1颗温暖的心` 提供教程：
<https://www.kdocs.cn/l/coioFy5l7vwW>
:::

![cat-catch](./images/catcatch-2.png)

- 安装 [猫爪](https://github.com/xifangczy/cat-catch) 最新版
- 在设置中添加调用程序：

  `mediago-community://index.html/?n=true&name=${title}&url=${url|to:urlEncode}&headers=${referer|exists:'Referer:*'|to:urlEncode}&silent=true&downloadNow=false`

  ![alt text](./images/catcatch-3.png)

- 设置完成之后可以在猫爪的面板中点击直接调用 MediaGo 下载

  ![alt text](./images/catcatch-4.png)
