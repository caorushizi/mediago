import React, { ReactNode } from "react";
const { ipcRenderer } = window.require("electron");

class Comment extends React.Component {
  componentDidMount(): void {
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
          const url = link.getAttribute("href");
          e.preventDefault();
          ipcRenderer.send("open-url", url);
        });
      });
    }, 200);
  }

  render(): ReactNode {
    return <div id="vcomments" />;
  }
}

export default Comment;
