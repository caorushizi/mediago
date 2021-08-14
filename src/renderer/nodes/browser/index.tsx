import React from "react";
import "./index.scss";
import { Spin } from "antd";
import tdApp from "renderer/utils/td";
import "antd/dist/antd.css";
import variables from "renderer/utils/variables";
import { insertFav, isFavFunc, removeFav } from "renderer/utils/localforge";
import WindowToolBar from "renderer/components/WindowToolBar";
import SearchBar from "./elements/SearchBar";
import onEvent from "renderer/utils/td-utils";
import electron from "renderer/utils/electron";

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

interface State {
  url: string;
  title: string;
  isFav: boolean;
}

class BrowserWindow extends React.Component<any, State> {
  resizeObserver?: ResizeObserver;

  webviewRef = React.createRef<HTMLDivElement>();

  constructor(props: any) {
    super(props);

    this.state = {
      url: "",
      title: "",
      isFav: false,
    };
  }

  componentDidMount() {
    this.initWebView();
    window.electron.addEventListener("dom-ready", this.handleViewDOMReady);
  }

  componentWillUnmount() {
    window.electron.setBrowserViewRect({ x: 0, y: 0, height: 0, width: 0 });
    window.electron.removeEventListener("dom-ready", this.handleViewDOMReady);
    this.resizeObserver?.disconnect();
  }

  handleViewDOMReady = async (
    e: Electron.IpcRendererEvent,
    { url, title }: { url: string; title: string }
  ): Promise<void> => {
    const isFav = await isFavFunc(url);
    this.setState({ title, url, isFav });
    document.title = title;
  };

  initWebView = () => {
    const webviewRef = this.webviewRef.current;
    if (webviewRef) {
      const rect = computeRect(webviewRef.getBoundingClientRect());
      window.electron.setBrowserViewRect(rect);

      // 监控 webview 元素的大小
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        const viewRect = computeRect(entry.contentRect);
        viewRect.x += rect.x;
        viewRect.y += rect.y;
        window.electron.setBrowserViewRect(viewRect);
      });
      this.resizeObserver.observe(webviewRef);
    }
  };

  onGoBack = () => {
    onEvent.browserPageGoBack();
    electron.browserViewGoBack();
  };

  onReload = () => {
    onEvent.browserPageReload();
    electron.browserViewReload();
  };

  onGoBackHome = () => {
    electron.browserViewLoadURL();
  };

  onUrlChange = (url: string) => {
    this.setState({ url });
  };

  handleEnter = () => {
    const { url } = this.state;
    electron.browserViewLoadURL(url);
  };

  handleClickFav = async () => {
    const { title, url } = this.state;
    const isFav = await isFavFunc(url);
    if (isFav) {
      await removeFav({ title, url });
    } else {
      await insertFav({ title, url });
    }
    this.setState({ isFav: !isFav });
  };

  render() {
    const { url, title, isFav } = this.state;
    return (
      <div className="browser-window">
        <WindowToolBar
          onClose={() => {
            window.electron.closeBrowserWindow();
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

export default BrowserWindow;
