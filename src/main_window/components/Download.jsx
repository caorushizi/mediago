import React from "react";
import "./Download.scss";
import PropTypes from "prop-types";
import { ipcRenderer } from "electron";
import { PrimaryButton, TextField, Stack } from "@fluentui/react";
import { ipcExec } from "../utils";

// const parseTest = async () => {
//   const resp = await axios.get(
//   );
//   const parser = new Parser();
//   parser.push(resp.data);
//   parser.end();
//   const parsedManifest = parser.manifest;
//   console.log(parsedManifest);
// };

class Download extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      url: "",
      headers: "",
      err: "",
      m3u8List: [],
    };

    // parseTest();

    this.handleStartDownload = this.handleStartDownload.bind(this);
    this.handleWebViewMessage = this.handleWebViewMessage.bind(this);
    this.handleClickM3U8Item = this.handleClickM3U8Item.bind(this);
    this.handleOpenBrowserWindow = this.handleOpenBrowserWindow.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on("m3u8", this.handleWebViewMessage);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener("m3u8", this.handleWebViewMessage);
  }

  handleWebViewMessage(e, ...args) {
    const [m3u8Object] = args;
    console.log("下载页面收到链接：", JSON.stringify(m3u8Object));
    const { m3u8List } = this.state;
    this.setState({
      m3u8List: [...m3u8List, m3u8Object],
    });
  }

  async handleStartDownload() {
    const { local } = this.props;
    const { name, url, headers } = this.state;

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

    await ipcExec(name, local, url, headers);
  }

  handleClickM3U8Item(item) {
    const { title, requestDetails } = item;
    const { requestHeaders, url } = requestDetails;
    const headers = Object.keys(requestHeaders)
      .reduce((result, key) => {
        result.push(`${key}~${requestHeaders[key]}`);
        return result;
      }, [])
      .join("|");
    this.setState({ name: title, url, headers });
  }

  handleOpenBrowserWindow() {
    console.log(this);
    ipcRenderer.send("openBrowserWindow");
  }

  render() {
    const { name, url, err, m3u8List, headers } = this.state;
    return (
      <div className="download">
        <Stack tokens={{ childrenGap: 5 }}>
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

          <TextField
            label="请求头"
            value={headers}
            onChange={(e) => this.setState({ headers: e.target.value })}
          />

          <div className="form-item">
            <Stack horizontal tokens={{ childrenGap: 15 }}>
              <PrimaryButton onClick={this.handleStartDownload}>
                开始下载
              </PrimaryButton>

              <PrimaryButton onClick={this.handleOpenBrowserWindow}>
                打开
              </PrimaryButton>
              <span style={{ color: "red" }}>{err}</span>
            </Stack>
          </div>
        </Stack>

        <div className="m3u8-list">
          {m3u8List.map((item) => (
            <div
              role="presentation"
              className="m3u8-item"
              key={item.requestDetails.url}
              onClick={() => this.handleClickM3U8Item(item)}
            >
              <div className="title">
                标题：
                {item.title}
              </div>
              <div className="url">
                链接：
                {item.requestDetails.url}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

Download.propTypes = {
  local: PropTypes.string.isRequired,
};

export default Download;
