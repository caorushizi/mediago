import React, { ReactNode } from "react";
import { Button, Descriptions, FormInstance, Space } from "antd";
import { ipcSetStore } from "renderer/main-window/utils";
import "./index.scss";
import variables from "renderer/common/scripts/variables";
import ProForm, {
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-form";
import { FolderOpenOutlined } from "@ant-design/icons";
import { remote, ipcRenderer } from "renderer/common/scripts/electron";
import { path } from "renderer/common/scripts/node";

interface Props {
  workspace: string;
  exeFile: string;
  tip: boolean;
  onWorkspaceChange: (path: string) => void;
  onExeFileChange: (bin: string) => void;
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
  formRef = React.createRef<FormInstance<FormData>>();

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
    const { exeFile } = this.props;
    this.setState({
      downloader: {
        title: exeFile === "mediago" ? "mediago" : "N_m3u8DL-CLI",
        description: "",
        github:
          exeFile === "mediago"
            ? variables.urls.mediaGoUrl
            : variables.urls.m3u8Url,
      },
    });
  }

  // 选择下载地址
  handleSelectDir = async (): Promise<void> => {
    const { filePaths } = await remote.dialog.showOpenDialog({
      defaultPath: remote.app.getPath("documents"),
      properties: ["openDirectory"],
    });
    // 没有返回值
    if (!filePaths) return;
    // 返回值为空
    if (Array.isArray(filePaths) && filePaths.length <= 0) return;
    const { onWorkspaceChange } = this.props;
    const workspaceValue = filePaths[0];
    await ipcSetStore("workspace", workspaceValue);
    this.formRef.current?.setFieldsValue({
      workspace: workspaceValue || "",
    });
    onWorkspaceChange(workspaceValue);
  };

  // 打开配置文件文件夹
  openConfigDir = async (): Promise<void> => {
    const appName =
      process.env.NODE_ENV === "development"
        ? "media downloader dev"
        : "media downloader";
    const appPath = remote.app.getPath("appData");
    await remote.shell.openPath(path.resolve(appPath, appName));
  };

  // 打开可执行程序文件夹
  openBinDir = async (): Promise<void> => {
    const binDir = await ipcRenderer.invoke("getBinDir");
    await remote.shell.openPath(binDir);
  };

  // 本地存储文件夹
  localDir = async (): Promise<void> => {
    const { workspace } = this.props;
    await remote.shell.openPath(workspace);
  };

  render(): ReactNode {
    const { downloader } = this.state;
    const { workspace, exeFile, tip } = this.props;
    return (
      <div className="setting-form">
        <ProForm<FormData>
          formRef={this.formRef as any}
          layout="horizontal"
          submitter={false}
          initialValues={{ workspace, exeFile, tip }}
          onValuesChange={async (changedValue) => {
            if (Object.keys(changedValue).includes("tip")) {
              await ipcSetStore("tip", changedValue["tip"]);
            }
            if (Object.keys(changedValue).includes("exeFile")) {
              const { onExeFileChange } = this.props;
              const value = changedValue["exeFile"];
              await ipcSetStore("exeFile", value);
              onExeFileChange(value);
              this.setState({
                downloader: {
                  title: value === "mediago" ? "mediago" : "N_m3u8DL-CLI",
                  description: "",
                  github:
                    value === "mediago"
                      ? variables.urls.mediaGoUrl
                      : variables.urls.m3u8Url,
                },
              });
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
                <Button
                  onClick={this.handleSelectDir}
                  icon={<FolderOpenOutlined />}
                >
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
            <a
              onClick={async (e) => {
                e.preventDefault();
                await remote.shell.openExternal(downloader.github);
              }}
            >
              {downloader.github}
            </a>
          </Descriptions.Item>
        </Descriptions>
        <Space>
          <Button onClick={this.openConfigDir} icon={<FolderOpenOutlined />}>
            配置文件目录
          </Button>
          <Button onClick={this.openBinDir} icon={<FolderOpenOutlined />}>
            可执行程序目录
          </Button>
          <Button onClick={this.localDir} icon={<FolderOpenOutlined />}>
            本地存储目录
          </Button>
        </Space>
      </div>
    );
  }
}

export default Setting;
