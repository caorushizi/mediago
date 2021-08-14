import React, { ReactNode } from "react";

class Comment extends React.Component {
  componentDidMount(): void {
    // @ts-ignore
    new Valine({
      el: "#vcomments",
      appId: import.meta.env.VITE_APP_VC_AK,
      appKey: import.meta.env.VITE_APP_VC_SK,
      placeholder: "快来评论下吧～",
      avatar: "hide",
      meta: ["nick", "mail"],
      requiredFields: ["nick"],
      path: import.meta.env.VITE_APP_VC_PATH,
    });

    setTimeout(() => {
      const links = document.querySelectorAll("a[href]");
      links.forEach((link) => {
        link.addEventListener("click", (e) => {
          const url = link.getAttribute("href")!;
          e.preventDefault();
          window.electron.openExternal(url);
        });
      });
    }, 200);
  }

  render(): ReactNode {
    return <div id="vcomments" />;
  }
}

export default Comment;
