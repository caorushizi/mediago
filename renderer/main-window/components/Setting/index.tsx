import React, { ReactNode } from "react";
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
import { string } from "prop-types";

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

interface Downloader {
  title: string;
  description: string;
  github: string;
}

interface State {
  downloader: Downloader;
}

class Setting extends React.Component<Props, State> {
  workspaceFormRef = React.createRef<FormInstance>();

  exeFileFormRef = React.createRef<FormInstance>();

  constructor(props: Props) {
    super(props);
    this.state = {
      downloader: {
        title: "",
        description: "",
        github: "",
      },
    };
  }

  componentDidMount(): void {
    const { workspace, exeFile } = this.props;
    this.workspaceFormRef.current?.setFieldsValue({
      workspace: workspace || "",
    });
    this.exeFileFormRef.current?.setFieldsValue({
      exeFile: exeFile || "",
    });
    if (exeFile === "mediago") {
      this.setState({
        downloader: {
          title: "mediago",
          description: "123",
          github: "123",
        },
      });
    } else {
      this.setState({
        downloader: {
          title: "N_m3u8DL-CLI",
          description: "123",
          github: "123",
        },
      });
    }
  }

  // 选择默认下载器
  handleSelectExeFile = async (value: string): Promise<void> => {
    await ipcSetStore("exeFile", value);
    if (value === "mediago") {
      this.setState({
        downloader: {
          title: "mediago",
          description: "123",
          github: "123",
        },
      });
    } else {
      this.setState({
        downloader: {
          title: "N_m3u8DL-CLI",
          description: "123",
          github: "123",
        },
      });
    }
  };

  // 选择下载地址
  handleSelectDir = async (): Promise<void> => {
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

  render(): ReactNode {
    const { downloader } = this.state;
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
          <Descriptions title={downloader.title}>
            <Descriptions.Item label="描述">
              {downloader.description}
            </Descriptions.Item>
            <Descriptions.Item label="源代码地址">
              {downloader.github}
            </Descriptions.Item>
          </Descriptions>
        </Form>
      </div>
    );
  }
}
export default Setting;
