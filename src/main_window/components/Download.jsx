import React from "react";
import "./Download.scss";
import PropTypes from "prop-types";
import { remote, ipcRenderer } from "electron";
import { PrimaryButton, TextField, Label } from "@fluentui/react";
import { ipcExec } from "../utils";

class Download extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      url: "",
      err: "",
      inputUrl: "https://baidu.com",
      m3u8List: [],
    };

    this.handleStartDownload = this.handleStartDownload.bind(this);
    this.handleWebViewMessage = this.handleWebViewMessage.bind(this);
    this.handleViewDOMReady = this.handleViewDOMReady.bind(this);
  }

  componentDidMount() {
    this.window = remote.getCurrentWindow();
    this.view = this.window.getBrowserView();

    if (this.view) {
      const videoView = document.getElementById("videoView");
      const { left, top, width, height } = videoView.getBoundingClientRect();
      console.log(this.view);
      console.log(left, top, width, height);
      this.view.setBounds({
        x: Math.floor(left),
        y: Math.floor(top),
        width: Math.floor(width),
        height: Math.floor(height),
      });
      this.view.webContents.on("dom-ready", this.handleViewDOMReady);
    }

    ipcRenderer.on("m3u8", this.handleWebViewMessage);
  }

  componentWillUnmount() {
    if (this.view) {
      this.view.setBounds({ x: 0, y: 0, height: 0, width: 0 });
      this.view.webContents.off("dom-ready", this.handleViewDOMReady);
      this.window = null;
      this.view = null;
    }

    ipcRenderer.removeListener("m3u8", this.handleWebViewMessage);
  }

  handleWebViewMessage(e, ...args) {
    const [m3u8Url] = args;
    console.log("下载页面收到链接：", m3u8Url);
    const { m3u8List } = this.state;
    this.setState({
      m3u8List: [...m3u8List, m3u8Url],
    });
  }

  async handleStartDownload() {
    const { local } = this.props;
    const { name, url } = this.state;

    if (!name) {
      this.setState({ err: "请输入视频名称" });
      return;
    }

    if (!url) {
      this.setState({ err: "请输入 m3u8 地址" });
      return;
    }

    if (!local) {
      this.setState({ err: "错误" });
      return;
    }

    this.setState({ err: "" });

    const result = await ipcExec(name, local, url);
    console.log("result : ", result);
    const { code, msg, data } = result;
    if (code === 0) {
      console.log("成功：", data);
    } else {
      console.log("出错");
      console.log(msg);
    }
  }

  handleViewDOMReady() {
    console.log("dom-ready");
    this.setState({ name: this.view.webContents.getTitle() });
  }

  render() {
    const { name, url, err, inputUrl, m3u8List } = this.state;
    return (
      <div className="download">
        <div className="m3u8-list">
          {m3u8List.map((item) => (
            <button
              type="button"
              className="m3u8-item"
              key={item}
              onClick={() => {
                this.setState({ url: item });
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <form className="form download-form">
          <TextField
            required
            label="视频名称"
            value={name}
            onChange={(e) => this.setState({ name: e.target.value })}
          />

          <TextField
            required
            label="m3u8 链接"
            value={url}
            onChange={(e) => this.setState({ url: e.target.value })}
          />

          <div className="form-item">
            <PrimaryButton onClick={this.handleStartDownload}>
              开始下载
            </PrimaryButton>
            <span style={{ color: "red" }}>{err}</span>
          </div>
        </form>

        <div className="webview-container">
          <div id="videoView">webview</div>
          <div className="webview-nav">
            <input
              className="webview-input"
              type="text"
              value={inputUrl}
              onChange={(e) => {
                this.setState({
                  inputUrl: e.target.value,
                });
              }}
            />
            <PrimaryButton
              onClick={async () => {
                await this.view.webContents.loadURL(inputUrl);
              }}
            >
              go
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                this.view.webContents.reload();
              }}
            >
              刷新
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                const canGoBack = this.view.webContents.canGoBack();
                if (canGoBack) {
                  this.view.webContents.goBack();
                }
              }}
            >
              返回
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }
}

Download.propTypes = {
  local: PropTypes.string.isRequired,
};

export default Download;
