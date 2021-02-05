import ReactDOM from "react-dom";
import React from "react";
import "./index.scss";
import { PrimaryButton, TextField } from "@fluentui/react";
import { remote, ipcRenderer } from "electron";
import { BiArrowBack } from "react-icons/bi";
import { IoMdRefresh } from "react-icons/io";
import { onEvent } from "../renderer_common/utils";

document.title = window.location.href;
window.onhashchange = () => {
  document.title = window.location.href;
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      url: "https://baidu.com",
    };

    this.handleViewDOMReady = this.handleViewDOMReady.bind(this);
  }

  componentDidMount() {
    // fixme: 添加到window的时机
    setTimeout(() => {
      this.window = remote.getCurrentWindow();
      this.view = this.window.getBrowserView();

      console.log("view: ", this.view);
      if (this.view) {
        const videoView = document.getElementById("videoView");
        const { left, top, width, height } = videoView.getBoundingClientRect();
        this.view.setBounds({
          x: Math.floor(left),
          y: Math.floor(top),
          width: Math.floor(width),
          height: Math.floor(height),
        });
        this.view.webContents.on("dom-ready", this.handleViewDOMReady);
      }
    }, 5000);
  }

  componentWillUnmount() {
    if (this.view) {
      this.view.setBounds({ x: 0, y: 0, height: 0, width: 0 });
      this.view.webContents.off("dom-ready", this.handleViewDOMReady);
      this.window = null;
      this.view = null;
    }
  }

  handleViewDOMReady() {
    console.log("dom-ready");
    const { webContents } = this.view;
    this.setState({
      title: webContents.getTitle(),
      url: webContents.getURL(),
    });
  }

  render() {
    const { url, title } = this.state;
    return (
      <>
        <div className="tool-bar">
          <div className="tool-bar-left">
            <BiArrowBack
              className="icon"
              onClick={() => {
                onEvent("浏览器页面", "点击返回按钮");
                const canGoBack = this.view.webContents.canGoBack();
                if (canGoBack) {
                  this.view.webContents.goBack();
                }
              }}
            />
            <IoMdRefresh
              className="icon"
              onClick={() => {
                onEvent("浏览器页面", "点击刷新按钮");
                this.view.webContents.reload();
              }}
            />
          </div>
          <div className="title">{title}</div>
          <div className="tool-bar-right">
            <div
              className="button"
              role="presentation"
              onClick={() => {
                ipcRenderer.send("closeBrowserWindow");
              }}
            >
              关闭
            </div>
          </div>
        </div>
        <div className="webview-container">
          <div className="webview-nav">
            <TextField
              underlined
              value={url}
              onChange={(e) => {
                this.setState({
                  url: e.target.value,
                });
              }}
              onRenderSuffix={() => (
                <div
                  role="presentation"
                  style={{ cursor: "pointer" }}
                  onClick={async () => {
                    onEvent("浏览器页面", "点击打开链接");
                    await this.view.webContents.loadURL(url);
                  }}
                >
                  打开链接
                </div>
              )}
            />
          </div>
          <div id="videoView">webview</div>
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
