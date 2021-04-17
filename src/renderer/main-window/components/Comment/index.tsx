import React, { ReactNode } from "react";

const Valine = window.require("valine");

interface Props {}

interface State {}

class Comment extends React.Component<Props, State> {
  componentDidMount(): void {
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,no-new
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
    }, 100);
  }

  render(): ReactNode {
    return <div id="vcomments" />;
  }
}

export default Comment;
