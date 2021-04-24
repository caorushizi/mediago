import React, { ReactNode } from "react";
import {
  Button,
  Descriptions,
  Form,
  FormInstance,
  Input,
  Select,
  Switch,
} from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { ipcSetStore } from "renderer/main-window/utils";
import "./index.scss";
import variables from "renderer/common/scripts/variables";
import ProForm, {
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-form";
const path = window.require("path");

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
  tip: boolean;
  onWorkspaceChange: (path: string) => void;
}

interface Downloader {
  title: string;
  description: string;
  github: string;
}

interface State {
  downloader: Downloader;
}

interface FormData {
  exeFile: string;
  workspace: string;
  tip: boolean;
}

// 设置页面
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
    const { workspace, exeFile, tip } = this.props;
    this.workspaceFormRef.current?.setFieldsValue({
      workspace: workspace || "",
      tip,
    });
    this.exeFileFormRef.current?.setFieldsValue({
      exeFile: exeFile || "",
    });
    if (exeFile === "mediago") {
      this.setState({
        downloader: {
          title: "mediago",
          description: "",
          github: variables.urls.mediaGoUrl,
        },
      });
    } else {
      this.setState({
        downloader: {
          title: "N_m3u8DL-CLI",
          description: "",
          github: variables.urls.m3u8Url,
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
          description: "",
          github: variables.urls.mediaGoUrl,
        },
      });
    } else {
      this.setState({
        downloader: {
          title: "N_m3u8DL-CLI",
          description: "",
          github: variables.urls.m3u8Url,
        },
      });
    }
  };

  // 播放提示音更改
  handleChangeTip = async (value: boolean): Promise<void> => {
    await ipcSetStore("tip", value);
    this.workspaceFormRef.current?.setFieldsValue({
      tip: value || false,
    });
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
    const { onWorkspaceChange } = this.props;
    const workspaceValue = result[0];
    await ipcSetStore("workspace", workspaceValue);
    this.workspaceFormRef.current?.setFieldsValue({
      workspace: workspaceValue || "",
    });
    onWorkspaceChange(workspaceValue);
  };

  // 打开配置文件路径
  openConfigDir = async (): Promise<void> => {
    const appName =
      process.env.NODE_ENV === "development"
        ? "media downloader dev"
        : "media downloader";
    const appPath = remote.app.getPath("appData");
    await remote.shell.openPath(path.resolve(appPath, appName));
  };

  render(): ReactNode {
    const { downloader } = this.state;
    const { workspace, exeFile, tip } = this.props;
    return (
      <div className="setting-form">
        <ProForm<FormData>
          layout="horizontal"
          submitter={false}
          initialValues={{ workspace, exeFile, tip }}
          onValuesChange={async (changedValue) => {
            if (Object.keys(changedValue).includes("tip")) {
              await this.handleChangeTip(changedValue["tip"]);
            }
            if (Object.keys(changedValue).includes("exeFile")) {
              await this.handleSelectExeFile(changedValue["exeFile"]);
            }
          }}
        >
          <ProFormGroup label="基础设置">
            <ProFormText
              width="xl"
              disabled
              name="workspace"
              placeholder="请选择视频下载目录"
              label={
                <Button type="link" onClick={this.handleSelectDir}>
                  选择文件夹
                </Button>
              }
            />
            <ProFormSwitch label="下载完成提示" name="tip" />
          </ProFormGroup>
          <ProFormGroup label="下载设置">
            <ProFormSelect
              width="xl"
              name="exeFile"
              label="默认下载器"
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
            />
          </ProFormGroup>
        </ProForm>
        <Descriptions title={downloader.title}>
          <Descriptions.Item label="源代码地址">
            <Button
              type="link"
              onClick={async () => {
                await remote.shell.openExternal(downloader.github);
              }}
            >
              {downloader.github}
            </Button>
          </Descriptions.Item>
        </Descriptions>
        <Button onClick={this.openConfigDir}>打开配置文件路径</Button>
      </div>
    );
  }
}

export default Setting;
