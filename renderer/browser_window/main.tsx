import * as ReactDOM from "react-dom";
import * as React from "react";
import "./index.scss";
import { Drawer, Input, Spin } from "antd";
import {
  ArrowLeftOutlined,
  HomeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import tdApp from "../common/scripts/td";
import "antd/dist/antd.css";
import { SourceUrl, SourceUrlToRenderer } from "../../types/common";

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
  drawerVisible: boolean;
  m3u8List: SourceUrl[];
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
      drawerVisible: false,
      m3u8List: [],
    };
  }

  async componentDidMount() {
    // 页面刷新时提供 view 的初始化
    this.view = remote.getCurrentWindow().getBrowserView();
    await this.initWebView();

    ipcRenderer.on("viewReady", this.handleViewReady);
    ipcRenderer.on("m3u8", this.handleWebViewMessage);
  }

  componentWillUnmount() {
    this.view?.setBounds({ x: 0, y: 0, height: 0, width: 0 });
    this.view?.webContents.off("dom-ready", this.handleViewDOMReady);
    ipcRenderer.removeListener("viewReady", this.handleViewReady);
    ipcRenderer.removeListener("m3u8", this.handleWebViewMessage);
    this.view = undefined;
    this.resizeObserver?.disconnect();
  }

  handleWebViewMessage: typeof SourceUrlToRenderer = (event, source) => {
    const { m3u8List } = this.state;
    if (
      m3u8List.findIndex((item) => item.detail.url === source.detail.url) < 0
    ) {
      this.setState({
        m3u8List: [...m3u8List, source],
      });
    }
  };

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
    this.view = remote.getCurrentWindow().getBrowserView();

    await this.initWebView();
  };

  initWebView = async () => {
    const { drawerVisible } = this.state;
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
        console.log(drawerVisible);
        drawerVisible && view.setBounds(viewRect);
      });
      this.resizeObserver.observe(webviewRef);
    }
  };

  onClose = () => {
    this.setState({ drawerVisible: false });
  };

  showDrawer = () => {
    this.view?.setBounds({ x: 0, y: 0, height: 0, width: 0 });
    this.setState({ drawerVisible: true });
  };

  afterVisibleChange = (visible: boolean) => {
    if (!visible) {
      const webviewRef = this.webviewRef.current;
      if (webviewRef) {
        const rect = computeRect(webviewRef.getBoundingClientRect());
        this.view?.setBounds(rect);
      }
    }
  };

  render() {
    const { url, title, drawerVisible, m3u8List } = this.state;
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
          <div className="webview-inner">
            <div className="playlist">
              <ul>
                {m3u8List.map((m3u8) => (
                  <li onClick={this.showDrawer}>{m3u8.title}</li>
                ))}
              </ul>
            </div>
            <div id="videoView" ref={this.webviewRef}>
              <Spin />
            </div>
          </div>
        </div>
        <Drawer
          title="Basic Drawer"
          className="playlist-drawer"
          placement="right"
          closable={false}
          onClose={this.onClose}
          visible={drawerVisible}
          afterVisibleChange={this.afterVisibleChange}
        >
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Drawer>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
