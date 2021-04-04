import * as ReactDOM from "react-dom";
import * as React from "react";
import "./index.scss";
import { Button, Drawer, Space, Spin, Tag } from "antd";
import { DownloadOutlined, SettingOutlined } from "@ant-design/icons";
import tdApp from "../common/scripts/td";
import "antd/dist/antd.css";
import { SourceUrl, SourceUrlToRenderer } from "../../types/common";
import WindowToolBar from "../common/components/WindowToolBar";
import axios from "axios";
import SearchBar from "./SearchBar";

const m3u8Parser = window.require("m3u8-parser");
const { remote, ipcRenderer } = window.require("electron");

tdApp.init();

function formatTime(seconds: number) {
  return [
    Math.floor(seconds / 60 / 60),
    Math.floor((seconds / 60) % 60),
    Math.floor(seconds % 60),
  ]
    .join(":")
    .replace(/\b(\d)\b/g, "0$1");
}

type M3u8Detail = SourceUrl & {
  loading: boolean;
  error: boolean;
  duration: number;
  segmentLen: number;
};

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
  currentSource: M3u8Detail | null;
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
      m3u8List: [
        JSON.parse(
          '{"title":"新封神：哪吒重生1080P在线播放,免费观看电影完整版-青苹果影院新封神：哪吒重生1080P在线播放,免费观看电影完整版-青苹果影院","details":{"id":949,"url":"https://vod.ebaiya.com/20210402/OZAmg4R0/1704kb/hls/index.m3u8","method":"GET","timestamp":1617539297192.7349,"resourceType":"xhr","webContentsId":6,"referrer":"","requestHeaders":{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Electron/11.2.1 Safari/537.36","Accept":"*/*","Origin":"https://dp.url-play.top","Sec-Fetch-Site":"cross-site","Sec-Fetch-Mode":"cors","Sec-Fetch-Dest":"empty","Accept-Encoding":"gzip, deflate, br","Accept-Language":"zh-CN"}}}'
        ),
      ],
      currentSource: null,
    };
  }

  async componentDidMount() {
    // 页面刷新时提供 view 的初始化
    this.view = remote.getCurrentWindow().getBrowserView();
    // await this.initWebView();

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
    console.log(JSON.stringify(source));
    const { m3u8List } = this.state;
    if (
      m3u8List.findIndex((item) => item.details.url === source.details.url) < 0
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

    // await this.initWebView();
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

  showDrawer = async (m3u8: SourceUrl) => {
    this.view?.setBounds({ x: 0, y: 0, height: 0, width: 0 });
    this.setState({
      drawerVisible: true,
      currentSource: {
        ...m3u8,
        loading: true,
        error: false,
        segmentLen: 0,
        duration: 0,
      },
    });
    try {
      const resp = await axios({
        method: m3u8.details.method as any,
        headers: m3u8.details.requestHeaders,
        url: m3u8.details.url,
      });
      console.log(resp);
      const parser = new m3u8Parser.Parser();
      parser.push(resp.data);
      parser.end();
      const { manifest } = parser;
      let duration = 0;
      manifest.segments.forEach((item: any) => (duration += item.duration));
      const { currentSource } = this.state;
      this.setState({
        currentSource: {
          ...currentSource!,
          loading: false,
          error: false,
          segmentLen: 123,
          duration,
        },
      });
    } catch (e) {
      const { currentSource } = this.state;
      this.setState({
        currentSource: { ...currentSource!, loading: false, error: true },
      });
    }
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
    this.view?.webContents.loadURL("https://baidu.com");
  };

  onUrlChange = (url: string) => {
    console.log(url);
    this.setState({ url });
  };

  onSetting = () => {
    ipcRenderer.invoke("openSettingWindow");
  };

  render() {
    const { url, title, drawerVisible, m3u8List, currentSource } = this.state;
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
            onUrlChange={this.onUrlChange}
            onGoBack={this.onGoBack}
            onReload={this.onReload}
            onGoBackHome={this.onGoBackHome}
            onSetting={this.onSetting}
          />
          <div className="webview-inner">
            <div className="playlist">
              {m3u8List.map((m3u8) => (
                <div className="playlist-item">
                  <div className="media-title">{m3u8.title}</div>
                  <div className="action">
                    <div className="left">
                      <Tag color="processing">m3u8</Tag>
                    </div>
                    <div className="right">
                      <Space>
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            // event.preventDefault();
                            console.log(123123);
                          }}
                        />
                        <Button
                          type="primary"
                          icon={<SettingOutlined />}
                          size="small"
                          onClick={() => this.showDrawer(m3u8)}
                        />
                      </Space>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div id="videoView" ref={this.webviewRef}>
              <Spin />
            </div>
          </div>
        </div>
        {currentSource && (
          <Drawer
            title={currentSource.title}
            className="playlist-drawer"
            placement="right"
            onClose={this.onClose}
            maskClosable={false}
            visible={drawerVisible}
            afterVisibleChange={this.afterVisibleChange}
          >
            <p>url: {currentSource.details.url}</p>
            <p>headers:</p>
          </Drawer>
        )}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("root"));
