import React from "react";
import Valine from "valine";

interface Props {}
interface State {}

class Comment extends React.Component<Props, State> {
  componentDidMount() {
    setTimeout(() => {
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

  render() {
    return <div id="vcomments" />;
  }
}

export default Comment;
