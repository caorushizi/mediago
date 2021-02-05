import React from "react";
import "./Download.scss";
import PropTypes from "prop-types";
import { ipcRenderer } from "electron";
import {
  PrimaryButton,
  TextField,
  Stack,
  MessageBar,
  MessageBarType,
} from "@fluentui/react";
import { ipcExec } from "../utils";
import { onEvent } from "../../renderer_common/utils";

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
      m3u8List: [],
      showError: false,
      errorMsg: "",
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
    onEvent("下载页面", "开始下载");
    this.setState({ showError: false, errorMsg: "" });

    const { local, exeFile } = this.props;
    const { name, url, headers } = this.state;

    if (!name) {
      this.setState({ errorMsg: "请输入视频名称", showError: true });
      return;
    }

    if (!url) {
      this.setState({ errorMsg: "请输入 m3u8 地址", showError: true });
      return;
    }

    if (!local || !exeFile) {
      this.setState({
        errorMsg: "请先去设置页面配置本地路径和执行程序",
        showError: true,
      });
      return;
    }

    const { code, msg, data } = await ipcExec(
      exeFile,
      local,
      name,
      url,
      headers
    );
    console.log("获取到下载视频响应：", { code, msg, data });
    if (code === 0) {
      onEvent("下载页面", "下载视频成功", { code, msg, url });
    } else {
      this.setState({ showError: true, errorMsg: msg });
      onEvent("下载页面", "下载视频失败", { code, msg, url });
    }
  }

  handleClickM3U8Item(item) {
    this.setState({ showError: false, errorMsg: "" });
    const { exeFile } = this.props;
    const { title, requestDetails } = item;
    const { requestHeaders, url } = requestDetails;
    const headers = Object.keys(requestHeaders)
      .reduce((result, key) => {
        if (exeFile === "mediago") {
          result.push(`${key}~${requestHeaders[key]}`);
        } else {
          result.push(`${key}:${requestHeaders[key]}`);
        }
        return result;
      }, [])
      .join("|");
    this.setState({ name: title, url, headers });
  }

  handleOpenBrowserWindow() {
    onEvent("下载页面", "打开浏览器页面");
    console.log(this);
    ipcRenderer.send("openBrowserWindow");
  }

  render() {
    const { name, url, m3u8List, headers, showError, errorMsg } = this.state;

    const ErrorExample = () => (
      <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
        {errorMsg}
      </MessageBar>
    );

    return (
      <div className="download">
        {showError && <ErrorExample />}

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
                打开浏览器
              </PrimaryButton>
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
                {item.requestDetails.url.split("?")[0]}
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
  exeFile: PropTypes.string.isRequired,
};

export default Download;
