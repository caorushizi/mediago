import type { HeadConfig } from "vitepress";

export function baiduAnalytics(): HeadConfig[] {
  return [
    [
      "script",
      {},
      `var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?eefcbd14f0323044aa0ca678cd278381";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`,
    ],
  ];
}

export function googleAnalytics(): HeadConfig[] {
  return [
    [
      "script",
      {
        async: "true",
        src: "https://www.googletagmanager.com/gtag/js?id=G-C9VYLS8M3H",
      },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-C9VYLS8M3H');`,
    ],
  ];
}
