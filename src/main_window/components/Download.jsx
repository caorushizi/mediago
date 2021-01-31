import React from "react";
import "./Download.scss";
import PropTypes from "prop-types";
import { remote, ipcRenderer } from "electron";
import { ipcExec } from "../utils";

class Download extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      url: "",
      err: "",
      inputUrl: "https://baidu.com",
    };

    this.handleStartDownload = this.handleStartDownload.bind(this);
    this.handleWebViewMessage = this.handleWebViewMessage.bind(this);
  }

  componentDidMount() {
    this.window = remote.getCurrentWindow();
    this.view = this.window.getBrowserView();

    if (this.view) {
      const videoView = document.getElementById("videoView");
      const { left, top, width, height } = videoView.getBoundingClientRect();
      this.view.setBounds({ x: left, y: top, width, height });
    }

    ipcRenderer.on("channel", this.handleWebViewMessage);
  }

  componentWillUnmount() {
    if (this.view) {
      this.view.setBounds({ x: 0, y: 0, height: 0, width: 0 });
      this.window = null;
      this.view = null;
    }

    ipcRenderer.removeListener("channel", this.handleWebViewMessage);
  }

  handleWebViewMessage(e, ...args) {
    console.log(e);
    console.log(args);
    console.log(this);
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

  render() {
    const { name, url, err, inputUrl } = this.state;
    return (
      <div className="download">
        <form className="form download-form">
          <div className="form-item">
            <div className="form-item__label">视频名称：</div>
            <div className="form-item__inner">
              <input
                type="text"
                name="name"
                value={name}
                onChange={(e) => {
                  this.setState({
                    name: e.target.value,
                  });
                }}
              />
            </div>
          </div>

          <div className="form-item">
            <div className="form-item__label">m3u8 地址：</div>
            <div className="form-item__inner">
              <input
                type="text"
                name="url"
                value={url}
                onChange={(e) => {
                  this.setState({ url: e.target.value });
                }}
              />
            </div>
          </div>

          <div className="form-item">
            <button type="button" onClick={this.handleStartDownload}>
              开始下载
            </button>
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
            <button
              type="button"
              className="webview-button"
              onClick={() => {
                this.view.webContents.loadURL(inputUrl);
              }}
            >
              go
            </button>
            <button
              type="button"
              onClick={() => {
                this.view.webContents.reload();
              }}
            >
              刷新
            </button>
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
