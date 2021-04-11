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
  formRef = React.createRef<FormInstance>();

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { workspace, exeFile } = this.props;
    console.log(workspace, exeFile, 12123);
    this.formRef.current?.setFieldsValue({
      workspace: workspace || "",
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
    const workspace = this.formRef.current?.getFieldValue(["workspace"]);
    const result = remote.dialog.showOpenDialogSync({
      defaultPath: workspace || remote.app.getPath("documents"),
      properties: ["openDirectory"],
    });
    if (!result) return;
    const local = result[0];
    await ipcSetStore("local", local);
    this.formRef.current?.setFieldsValue({
      workspace: local || "",
    });
  };

  render() {
    return (
      <div>
        <Form ref={this.formRef}>
          <Divider orientation="left" plain>
            基础设置
          </Divider>
          <Form.Item label="本地路径" name="workspace">
            <Input
              disabled
              placeholder="请选择文件夹"
              addonAfter={<SettingOutlined onClick={this.handleSelectDir} />}
            />
          </Form.Item>
          <Form.Item label="下载完成提示" name="123">
            <Switch defaultChecked onChange={() => {}} />
          </Form.Item>
        </Form>
        <Divider orientation="left" plain>
          下载设置
        </Divider>
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
      </div>
    );
  }
}
export default Index;
