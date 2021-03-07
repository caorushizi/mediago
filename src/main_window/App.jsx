import React from "react";
import { remote, ipcRenderer } from "electron";
import "./App.scss";
import {
  Alert,
  Input,
  Divider,
  Button,
  Select,
  Form,
  Space,
  Row,
  Col,
  TimePicker,
  Checkbox,
  InputNumber,
} from "antd";
import { CloseOutlined, SettingOutlined } from "@ant-design/icons";
import { ipcExec, ipcGetStore, ipcSetStore } from "./utils";
import tdApp from "../renderer_common/td";

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

class App extends React.Component {
  formRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      exeFile: "",
      showMore: false,
      m3u8List: [],
      showError: false,
      errorMsg: "",
      alertType: "",
    };
  }

  async componentDidMount() {
    ipcRenderer.on("m3u8", this.handleWebViewMessage);

    const workspace = await ipcGetStore("local");
    const exeFile = await ipcGetStore("exeFile");

    this.formRef.current.setFieldsValue({
      workspace: workspace || "",
      exeFile: exeFile || "",
    });

    this.setState({ exeFile: exeFile || "" });
  }

  componentWillUnmount() {
    ipcRenderer.removeListener("m3u8", this.handleWebViewMessage);
  }

  handleSelectDir = async () => {
    const formRef = this.formRef.current;

    const workspace = formRef.getFieldValue(["workspace"]);
    const result = remote.dialog.showOpenDialogSync({
      defaultPath: workspace || remote.app.getPath("documents"),
      properties: ["openDirectory"],
    });
    if (!result) return;
    const local = result[0];
    await ipcSetStore("local", local);
    formRef.setFieldsValue({
      workspace: local || "",
    });
  };

  handleSelectExeFile = async (value) => {
    await ipcSetStore("exeFile", value);
    this.setState({ exeFile: value || "" });
  };

  handleWebViewMessage = (e, ...args) => {
    const [m3u8Object] = args;
    const { m3u8List } = this.state;
    if (
      m3u8List.findIndex(
        (item) => item.requestDetails.url === m3u8Object.requestDetails.url
      ) < 0
    ) {
      this.setState({
        m3u8List: [...m3u8List, m3u8Object],
      });
    }
  };

  handleClickM3U8Item = (item) => {
    this.setState({ showError: false, errorMsg: "" });
    const formRef = this.formRef.current;
    const exeFile = formRef.getFieldValue(["exeFile"]);
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
    formRef.setFieldsValue({
      name: title,
      url,
      headers,
    });
  };

  handleOpenBrowserWindow = () => {
    tdApp.onEvent("下载页面-打开浏览器页面");
    ipcRenderer.send("openBrowserWindow");
  };

  renderErrorMsg = () => {
    const { errorMsg, showError, alertType } = this.state;
    return showError && <Alert message={errorMsg} type={alertType} closable />;
  };

  onFinish = async (values) => {
    tdApp.onEvent("下载页面-开始下载");
    this.setState({ showError: false, errorMsg: "" });
    console.log(values);

    const { workspace, exeFile, name, url, headers } = values;
    const commonFields = ["exeFile", "workspace", "name", "url", "headers"];
    let args = "";
    if (exeFile !== "mediago") {
      Object.keys(values).forEach((value) => {
        if (commonFields.findIndex((key) => value === key) < 0) {
          let v = values[value];
          if (v) {
            let tempArgs;
            if (value === "downloadRange") {
              v = v?.map((m) => m.format("HH:mm:ss")).join("-");
              tempArgs = ` --${value} "${v}"`;
            } else if (value === "checkbox") {
              tempArgs = v?.map((c) => `--${c}`).join(" ");
            } else {
              tempArgs = ` --${value} "${v}"`;
            }
            args += tempArgs;
          }
        }
      });
    }

    console.log("args: ", args);

    const { code, msg } = await ipcExec(
      exeFile,
      workspace,
      name,
      url,
      headers,
      args
    );
    if (code === 0) {
      this.setState({
        showError: true,
        errorMsg: `${name} 下载完成`,
        alertType: "success",
      });
      tdApp.onEvent("下载页面-下载视频成功", { msg, url, exeFile });
    } else {
      this.setState({ showError: true, errorMsg: msg, alertType: "error" });
      tdApp.onEvent("下载页面-下载视频失败", { msg, url, exeFile });
    }
  };

  onFieldsChange = (a, b) => {
    console.log(a, b);
  };

  renderBaseForm = () => (
    <Row gutter={[16, 0]}>
      <Col span={12}>
        <Form.Item
          label="本地路径"
          name="workspace"
          rules={[{ required: true, message: "请选择本地路径" }]}
        >
          <Input
            disabled
            placeholder="请选择文件夹"
            addonAfter={<SettingOutlined onClick={this.handleSelectDir} />}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="执行程序"
          name="exeFile"
          rules={[{ required: true, message: "请选择执行程序" }]}
        >
          <Select
            placeholder="请选择执行程序"
            options={[
              {
                value: "N_m3u8DL-CLI",
                label: "N_m3u8DL-CLI（推荐）",
              },
              {
                value: "mediago",
                label: "mediago",
              },
            ]}
            onSelect={this.handleSelectExeFile}
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="视频名称"
          name="name"
          rules={[{ required: true, message: "请填写视频名称" }]}
        >
          <Input />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label="m3u8链接"
          name="url"
          rules={[{ required: true, message: "请填写 m3u8 链接" }]}
        >
          <Input />
        </Form.Item>
      </Col>
    </Row>
  );

  renderMediaGoForm = () => (
    <div>
      <Form.Item
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        label="请求标头"
        name="headers"
      >
        <Input />
      </Form.Item>
    </div>
  );

  renderM3u8Form = () => {
    const { showMore } = this.state;
    return (
      <>
        {showMore ? (
          <>
            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item label="请求标头" name="headers">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="BASEURL" name="baseUrl">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="混流文件" name="muxSetJson">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="设置代理" name="proxyAddress">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="自定义KEY" name="useKeyBase64">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="自定义IV" name="useKeyIV">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="范围选择" name="downloadRange">
                  <TimePicker.RangePicker />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item wrapperCol={{ span: 24 }} name="checkbox">
              <Checkbox.Group>
                <Row gutter={[16, 10]}>
                  <Col span={8}>
                    <Checkbox value="enableDelAfterDone">
                      合并后删除分片
                    </Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="disableDateInfo">
                      合并时不写入日期
                    </Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="noProxy">不使用系统代理</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="enableParseOnly">仅解析m3u8</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="enableMuxFastStart ">
                      混流MP4边下边看
                    </Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="noMerge ">下载完成后不合并</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="enableBinaryMerge ">
                      使用二进制合并
                    </Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="enableAudioOnly ">仅合并音频轨道</Checkbox>
                  </Col>
                  <Col span={8}>
                    <Checkbox value="disableIntegrityCheck ">
                      关闭完整性检查
                    </Checkbox>
                  </Col>
                </Row>
              </Checkbox.Group>
            </Form.Item>
            <Row gutter={[16, 0]}>
              <Col span={8}>
                <Form.Item
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 12 }}
                  label="最大线程"
                  name="maxThreads"
                >
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 12 }}
                  label="最小线程"
                  name="minThreads"
                >
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 12 }}
                  label="重试次数"
                  name="retryCount"
                >
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 12 }}
                  label="超时时长(s)"
                  name="timeOut"
                >
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 12 }}
                  label="停速(kb/s)"
                  name="stopSpeed"
                >
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  labelCol={{ span: 12 }}
                  wrapperCol={{ span: 12 }}
                  label="限速(kb/s)"
                  name="maxSpeed"
                >
                  <InputNumber min={0} />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : (
          <Form.Item
            labelCol={{ span: 3 }}
            wrapperCol={{ span: 21 }}
            label="请求标头"
            name="headers"
          >
            <Input />
          </Form.Item>
        )}
      </>
    );
  };

  renderActionButton = () => {
    const { m3u8List, showMore, exeFile } = this.state;
    return (
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            开始下载
          </Button>
          <Button type="primary" onClick={this.handleOpenBrowserWindow}>
            打开浏览器
          </Button>
          {m3u8List.length > 0 && (
            <Button
              type="primary"
              onClick={() => {
                this.setState({
                  m3u8List: [],
                });
              }}
            >
              清除列表
            </Button>
          )}
          <Button
            onClick={async () => {
              await remote.shell.openExternal(
                "https://blog.ziying.site/post/media-downloader-how-to-use/?form=client"
              );
            }}
          >
            使用帮助
          </Button>
          {exeFile !== "mediago" && (
            <Button
              type="link"
              onClick={() => {
                this.setState({ showMore: !showMore });
              }}
            >
              {showMore ? "隐藏" : "显示"}
              高级设置
            </Button>
          )}
        </Space>
      </Form.Item>
    );
  };

  render() {
    const { m3u8List, exeFile } = this.state;

    return (
      <div className="app">
        <div className="drag-region" />
        <div
          role="presentation"
          className="action-button"
          onClick={() => {
            ipcRenderer.send("closeMainWindow");
          }}
        >
          <CloseOutlined />
        </div>

        <div className="form">
          {this.renderErrorMsg()}
          <Form
            colon={false}
            className="form-inner"
            labelCol={layout.labelCol}
            wrapperCol={layout.wrapperCol}
            onFinish={this.onFinish}
            ref={this.formRef}
            onFieldsChange={this.onFieldsChange}
            size="small"
            initialValues={{
              maxThreads: 32,
              minThreads: 16,
              retryCount: 15,
              timeOut: 10,
              stopSpeed: 0,
              maxSpeed: 0,
            }}
          >
            {this.renderBaseForm()}
            {exeFile !== "mediago"
              ? this.renderM3u8Form()
              : this.renderMediaGoForm()}
            {this.renderActionButton()}
          </Form>

          <div className="m3u8-list">
            {m3u8List.length > 0 && (
              <Divider className="divider">辅助链接</Divider>
            )}
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
        <div className="toolbar">
          <div className="left" />
          <div className="right">
            2021.03.07更新（
            <span
              role="presentation"
              className="cursor"
              onClick={async () => {
                await remote.shell.openExternal(
                  "https://blog.ziying.site/post/media-downloader-how-to-use/?form=client"
                );
              }}
            >
              更新日志
            </span>
            ）
          </div>
        </div>
      </div>
    );
  }
}

export default App;
