import * as ReactDOM from "react-dom";
import * as React from "react";
import "./index.scss";
import { Input, Spin } from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import tdApp from "../renderer_common/td";
import "antd/dist/antd.css";

const { remote, ipcRenderer } = window.require("electron");
const { Search } = Input;

tdApp.init();

const computeRect = ({
  left,
  top,
  width,
  height,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
}) => ({
  x: Math.floor(left),
  y: Math.floor(top),
  width: Math.floor(width),
  height: Math.floor(height),
});

interface Props {}
interface State {
  url: string;
  title: string;
}

class App extends React.Component<Props, State> {
  static defaultProps = {};
  view?: Electron.BrowserView;
  resizeObserver?: ResizeObserver;
  webviewRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      url: "",
      title: "",
    };

    const window = remote.getCurrentWindow();
    this.view = window.getBrowserView();
  }

  async componentDidMount() {
    // 页面刷新时提供 view 的初始化
    await this.initWebView();

    ipcRenderer.on("viewReady", this.handleViewReady);
  }

  componentWillUnmount() {
    this.view?.setBounds({ x: 0, y: 0, height: 0, width: 0 });
    this.view?.webContents.off("dom-ready", this.handleViewDOMReady);
    this.view = undefined;
    this.resizeObserver?.disconnect();
  }

  handleViewDOMReady = () => {
    const url = this.view?.webContents?.getURL() ?? "";
    const title = this.view?.webContents?.getTitle() ?? "";
    this.setState({
      title,
      url,
    });
    document.title = title;
  };

  handleViewReady = async () => {
    // 在 browser window 创建时初始化 view
    await this.initWebView();
  };

  initWebView = async () => {
    const webviewRef = this.webviewRef.current;
    const view = this.view;
    if (webviewRef && view) {
      const rect = computeRect(webviewRef.getBoundingClientRect());
      view.setBounds(rect);
      view.webContents.on("dom-ready", this.handleViewDOMReady);
      await view.webContents.loadURL("https://baidu.com");

      // 监控 webview 元素的大小
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        const viewRect = computeRect(entry.contentRect);
        viewRect.x += rect.x;
        viewRect.y += rect.y;
        view.setBounds(viewRect);
      });
      this.resizeObserver.observe(webviewRef);
    }
  };

  render() {
    const { url, title } = this.state;
    return (
      <>
        <div className="tool-bar">
          <div className="tool-bar-left">
            <ArrowLeftOutlined
              className="icon"
              onClick={() => {
                tdApp.onEvent("浏览器页面-点击返回按钮");
                const canGoBack = this.view?.webContents.canGoBack();
                if (canGoBack) {
                  this.view?.webContents.goBack();
                }
              }}
            />
            <ReloadOutlined
              className="icon"
              onClick={() => {
                tdApp.onEvent("浏览器页面-点击刷新按钮");
                this.view?.webContents.reload();
              }}
            />
            <HomeOutlined
              className="icon home"
              onClick={async () => {
                await this.view?.webContents.loadURL("https://baidu.com");
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
            <Search
              value={url}
              onChange={(e) => {
                this.setState({ url: e.target.value });
              }}
              onPressEnter={async () => {
                tdApp.onEvent("浏览器页面-enter打开链接");
                await this.view?.webContents.loadURL(url);
              }}
              enterButton="打开链接"
              onSearch={async () => {
                tdApp.onEvent("浏览器页面-点击打开链接");
                await this.view?.webContents.loadURL(url);
              }}
            />
          </div>
          <div id="videoView" ref={this.webviewRef}>
            <Spin />
          </div>
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
