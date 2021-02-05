import ReactDOM from "react-dom";
import React from "react";
import "./index.scss";
import { TextField } from "@fluentui/react";
import { remote, ipcRenderer } from "electron";
import { BiArrowBack } from "react-icons/bi";
import { IoMdRefresh } from "react-icons/io";
import { onEvent } from "../renderer_common/utils";

document.title = window.location.href;
window.onhashchange = () => {
  document.title = window.location.href;
};

const computeRect = ({ left, top, width, height }) => ({
  x: Math.floor(left),
  y: Math.floor(top),
  width: Math.floor(width),
  height: Math.floor(height),
});

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      url: "https://baidu.com",
    };

    this.handleViewDOMReady = this.handleViewDOMReady.bind(this);
    this.handleViewReady = this.handleViewReady.bind(this);
    this.initWebView = this.initWebView.bind(this);
  }

  componentDidMount() {
    // 页面刷新时提供 view 的初始化
    this.initWebView();

    ipcRenderer.on("viewReady", this.handleViewReady);
  }

  componentWillUnmount() {
    if (this.view) {
      const videoView = document.getElementById("videoView");
      this.view.setBounds({ x: 0, y: 0, height: 0, width: 0 });
      this.view.webContents.off("dom-ready", this.handleViewDOMReady);
      this.view = null;
      this.resizeObserver.disconnect(videoView);
    }
  }

  handleViewDOMReady() {
    const { webContents } = this.view;
    this.setState({
      title: webContents.getTitle(),
      url: webContents.getURL(),
    });
  }

  handleViewReady() {
    // 在 browser window 创建时初始化 view
    this.initWebView();
  }

  initWebView() {
    // 如果 view 已经初始化
    if (this.view) return;

    const window = remote.getCurrentWindow();
    const view = window.getBrowserView();
    if (!view) return; // 在初始化时通过组件挂载生命周期添加的

    this.view = view;
    const videoView = document.getElementById("videoView");
    const rect = computeRect(videoView.getBoundingClientRect());
    this.view.setBounds(rect);
    this.view.webContents.on("dom-ready", this.handleViewDOMReady);

    // 监控 webview 元素的大小
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const viewRect = computeRect(entry.contentRect);
      viewRect.x += rect.x;
      viewRect.y += rect.y;
      this.view.setBounds(viewRect);
    });
    this.resizeObserver.observe(videoView);
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
              隐藏
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
              onKeyPress={async (e) => {
                console.log(e);
                if (e.code === "Enter") {
                  onEvent("浏览器页面", "点击打开链接");
                  await this.view.webContents.loadURL(url);
                }
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
