import React from "react";
import {
  Descriptions,
  Divider,
  Form,
  FormInstance,
  Input,
  Select,
  Switch,
} from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { ipcSetStore } from "renderer/main-window/utils";
import "./index.scss";

const {
  remote,
  ipcRenderer,
}: {
  remote: Electron.Remote;
  ipcRenderer: Electron.IpcRenderer;
} = window.require("electron");

interface Props {
  workspace: string;
  exeFile: string;
}
interface State {}
class Index extends React.Component<Props, State> {
  workspaceFormRef = React.createRef<FormInstance>();

  exeFileFormRef = React.createRef<FormInstance>();

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount(): void {
    const { workspace, exeFile } = this.props;
    console.log(workspace, exeFile, 12123);
    this.workspaceFormRef.current?.setFieldsValue({
      workspace: workspace || "",
    });
    this.exeFileFormRef.current?.setFieldsValue({
      exeFile: exeFile || "",
    });
  }

  // 选择默认下载器
  handleSelectExeFile = async (value: string) => {
    await ipcSetStore("exeFile", value);
    this.setState({ exeFile: value || "" });
  };

  // 选择下载地址
  handleSelectDir = async () => {
    const workspace = this.workspaceFormRef.current?.getFieldValue([
      "workspace",
    ]);
    const result = remote.dialog.showOpenDialogSync({
      defaultPath: workspace || remote.app.getPath("documents"),
      properties: ["openDirectory"],
    });
    if (!result) return;
    const local = result[0];
    await ipcSetStore("local", local);
    this.workspaceFormRef.current?.setFieldsValue({
      workspace: local || "",
    });
  };

  render() {
    return (
      <div className="setting-form">
        <div className="form-title">基础设置</div>
        <Form className="form-inner" ref={this.workspaceFormRef}>
          <Form.Item label="本地路径" name="workspace">
            <Input
              disabled
              placeholder="请选择文件夹"
              addonAfter={<SettingOutlined onClick={this.handleSelectDir} />}
            />
          </Form.Item>
          <Form.Item label="下载完成提示" name="tip">
            <Switch defaultChecked onChange={() => {}} />
          </Form.Item>
        </Form>
        <div className="form-title">下载设置</div>
        <Form className="form-inner" ref={this.exeFileFormRef}>
          <Form.Item label="默认下载器" name="exeFile">
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
          <Descriptions title="N_m3u8DL-CLI">
            <Descriptions.Item label="描述">Zhou Maomao</Descriptions.Item>
            <Descriptions.Item label="源代码地址">1810000000</Descriptions.Item>
          </Descriptions>
        </Form>
      </div>
    );
  }
}
export default Index;
