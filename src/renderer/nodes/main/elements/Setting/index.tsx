import React, { ReactNode } from "react";
import {
  Button,
  Descriptions,
  FormInstance,
  Space,
  Switch,
  Tooltip,
} from "antd";
import "./index.scss";
import variables from "renderer/utils/variables";
import ProForm, {
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-form";
import { FolderOpenOutlined } from "@ant-design/icons";
import { AppState } from "renderer/store/reducers";
import { Dispatch } from "redux";
import { Settings } from "renderer/store/models/settings";
import { updateSettings } from "renderer/store/actions/settings.actions";
import { connect, ConnectedProps } from "react-redux";

interface Props extends PropsFromRedux {
  workspace: string;
  exeFile: string;
  tip: boolean;
}

interface Downloader {
  title: string;
  description: string;
  github: string;
}

interface State {
  downloader: Downloader;
  proxyChecked: boolean;
}

interface FormData {
  exeFile: string;
  workspace: string;
  tip: boolean;
  proxy: string;
}

const downloaderOptions = [
  {
    value: "mediago",
    label: "mediago",
  },
];

if (window.electron.is.windows) {
  downloaderOptions.push({
    value: "N_m3u8DL-CLI",
    label: "N_m3u8DL-CLI（推荐）",
  });
}

// 设置页面
class Setting extends React.Component<Props, State> {
  formRef = React.createRef<FormInstance<FormData>>();

  constructor(props: Props) {
    super(props);
    this.state = {
      proxyChecked: false,
      downloader: {
        title: "",
        description: "",
        github: "",
      },
    };
  }

  async componentDidMount(): Promise<void> {
    const proxy = await window.electron.store.get("proxy");
    this.formRef.current?.setFieldsValue({ proxy });
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
    const defaultPath = await window.electron.getPath("documents");
    const { filePaths } = await window.electron.showOpenDialog({
      defaultPath,
      properties: ["openDirectory"],
    });
    // 没有返回值
    if (!filePaths) return;
    // 返回值为空
    if (Array.isArray(filePaths) && filePaths.length <= 0) return;
    const { setSettings } = this.props;
    const workspaceValue = filePaths[0];
    await window.electron.store.set("workspace", workspaceValue);
    this.formRef.current?.setFieldsValue({
      workspace: workspaceValue || "",
    });
    setSettings({ workspace: workspaceValue });
  };

  // 打开配置文件文件夹
  openConfigDir = async (): Promise<void> => {
    window.electron.openConfigDir();
  };

  // 打开可执行程序文件夹
  openBinDir = () => {
    window.electron.openBinDir();
  };

  // 本地存储文件夹
  localDir = async (): Promise<void> => {
    const { workspace } = this.props;
    window.electron.openPath(workspace);
  };

  // 更改代理设置
  toggleProxySetting = async (enableProxy: boolean): Promise<void> => {
    // await ipcRenderer.send("setProxy", enableProxy);
    this.setState({ proxyChecked: enableProxy });
    await window.electron.store.set("useProxy", enableProxy);
  };

  render(): ReactNode {
    const { downloader, proxyChecked } = this.state;
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
              await window.electron.store.set("tip", changedValue["tip"]);
            }
            if (Object.keys(changedValue).includes("exeFile")) {
              const { setSettings } = this.props;
              const value = changedValue["exeFile"];
              await window.electron.store.set("exeFile", value);
              setSettings({ exeFile: value });
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
            // 代理 onchange 事件
            if (Object.keys(changedValue).includes("proxy")) {
              const value = changedValue["proxy"];
              await window.electron.store.set("proxy", value);
              if (this.state.proxyChecked) {
                await this.toggleProxySetting(false);
              }
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
            <ProFormText
              width="xl"
              name="proxy"
              placeholder="请填写代理地址"
              label="代理设置"
              fieldProps={{
                addonAfter: (
                  <Tooltip title="该代理会对软件自带浏览器以及下载时生效">
                    <Switch
                      checked={proxyChecked}
                      checkedChildren="代理生效"
                      unCheckedChildren="代理关闭"
                      onChange={this.toggleProxySetting}
                    />
                  </Tooltip>
                ),
              }}
            />
          </ProFormGroup>
          <ProFormGroup label="下载设置">
            <ProFormSelect
              allowClear={false}
              width="xl"
              name="exeFile"
              label="默认下载器"
              placeholder="请选择执行程序"
              options={downloaderOptions}
            />
          </ProFormGroup>
        </ProForm>
        <Descriptions title={downloader.title}>
          <Descriptions.Item label="源代码地址">
            <a
              onClick={async (e) => {
                e.preventDefault();
                window.electron.openExternal(downloader.github);
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
const mapStateToProps = (state: AppState) => ({
  settings: state.settings.settings,
});

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    setSettings: (settings: Partial<Settings>) =>
      dispatch(updateSettings(settings)),
  };
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Setting);
