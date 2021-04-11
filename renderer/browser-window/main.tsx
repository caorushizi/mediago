import ReactDOM from "react-dom";
import React from "react";
import "./index.scss";
import { Spin } from "antd";
import tdApp from "renderer/common/scripts/td";
import "antd/dist/antd.css";
import variables from "renderer/common/scripts/variables";
import {
  insertFav,
  isFavFunc,
  removeFav,
} from "renderer/common/scripts/localforge";
import WindowToolBar from "../common/components/WindowToolBar";
import SearchBar from "./SearchBar";

const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");

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
  isFav: boolean;
}

class App extends React.Component<Props, State> {
  view?: Electron.BrowserView;

  resizeObserver?: ResizeObserver;

  webviewRef = React.createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      url: "",
      title: "",
      isFav: false,
    };
  }

  async componentDidMount() {
    // 页面刷新时提供 view 的初始化
    this.view = remote.getCurrentWindow().getBrowserView();
    await this.initWebView();
    ipcRenderer.on("viewReady", this.handleViewReady);
  }

  componentWillUnmount() {
    this.view?.setBounds({ x: 0, y: 0, height: 0, width: 0 });
    this.view?.webContents.off("dom-ready", this.handleViewDOMReady);
    ipcRenderer.removeListener("viewReady", this.handleViewReady);
    this.view = undefined;
    this.resizeObserver?.disconnect();
  }

  handleViewDOMReady = async (): Promise<void> => {
    const url = this.view?.webContents?.getURL() || "";
    const title = this.view?.webContents?.getTitle() || "";
    const isFav = await isFavFunc(url);
    console.log(isFav, "isFav");
    this.setState({ title, url, isFav });
    document.title = title;
  };

  handleViewReady = async () => {
    // 在 browser window 创建时初始化 view
    this.view = remote.getCurrentWindow().getBrowserView();
    await this.initWebView();
  };

  initWebView = async () => {
    const webviewRef = this.webviewRef.current;
    const { view } = this;
    if (webviewRef && view) {
      const rect = computeRect(webviewRef.getBoundingClientRect());
      view.setBounds(rect);
      view.webContents.on("dom-ready", this.handleViewDOMReady);
      await view.webContents.loadURL(variables.urls.homePage);

      // 监控 webview 元素的大小
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        const viewRect = computeRect(entry.contentRect);
        viewRect.x += rect.x;
        viewRect.y += rect.y;
      });
      this.resizeObserver.observe(webviewRef);
    }
  };

  onGoBack = () => {
    tdApp.onEvent("浏览器页面-点击返回按钮");
    const canGoBack = this.view?.webContents.canGoBack();
    if (canGoBack) {
      this.view?.webContents.goBack();
    }
  };

  onReload = () => {
    tdApp.onEvent("浏览器页面-点击刷新按钮");
    this.view?.webContents.reload();
  };

  onGoBackHome = () => {
    this.view?.webContents.loadURL(variables.urls.homePage);
  };

  onUrlChange = (url: string) => {
    console.log(url);
    this.setState({ url });
  };

  handleEnter = async () => {
    console.log("进入");
  };

  handleClickFav = async () => {
    const { title, url } = this.state;
    console.log(url);
    const isFav = await isFavFunc(url);
    if (isFav) {
      await removeFav({ title, url });
    } else {
      await insertFav({ title, url });
    }
    console.log(isFav);
    this.setState({ isFav: !isFav });
  };

  render() {
    const { url, title, isFav } = this.state;
    return (
      <div className="browser-window">
        <WindowToolBar
          onClose={() => {
            ipcRenderer.send("closeBrowserWindow");
          }}
        >
          {title}
        </WindowToolBar>
        <div className="webview-container">
          <SearchBar
            className="webview-nav"
            url={url}
            isFav={isFav}
            onUrlChange={this.onUrlChange}
            onGoBack={this.onGoBack}
            onReload={this.onReload}
            onGoBackHome={this.onGoBackHome}
            handleEnter={this.handleEnter}
            handleClickFav={this.handleClickFav}
          />
          <div className="webview-inner">
            <div id="videoView" ref={this.webviewRef}>
              <Spin />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
