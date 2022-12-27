import React, { FC, useRef } from "react";
import { Button, FormInstance, Space, Switch, Tooltip } from "antd";
import "./index.scss";
import {
  ProForm,
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-components";
import { FolderOpenOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { AppState } from "../../store/reducers";
import { Settings, updateSettings } from "../../store/actions/settings.actions";
import { useDispatch, useSelector } from "react-redux";
import { version } from "../../../package.json";
import { downloaderOptions } from "../../utils";

const statisticsTooltip = `
是否允许统计用户数据
1. 统计数据不会用于商业用途，仅仅用于优化用户体验
2. 关闭用户统计依然会收集打开页面的次数，但不会收集任何自定义数据
3. 软件会统计页面报错，以便排查错误，请谅解~
`;

const {
  store,
  getPath,
  showOpenDialog,
  openConfigDir: openConfigDirElectron,
  openBinDir: openBinDirElectron,
  openPath,
} = window.electron;

// 设置页面
const Setting: FC = () => {
  const settings = useSelector<AppState, Settings>((state) => state.settings);
  const dispatch = useDispatch();
  const formRef = useRef<FormInstance<Settings>>();

  // 选择下载地址
  const handleSelectDir = async (): Promise<void> => {
    const defaultPath = await getPath("documents");
    const { filePaths } = await showOpenDialog({
      defaultPath,
      properties: ["openDirectory"],
    });
    // 没有返回值
    if (!filePaths) return;
    // 返回值为空
    if (Array.isArray(filePaths) && filePaths.length <= 0) return;
    const workspaceValue = filePaths[0];
    await store.set("workspace", workspaceValue);
    formRef.current?.setFieldsValue({
      workspace: workspaceValue || "",
    });

    dispatch(updateSettings({ workspace: workspaceValue }));
  };

  // 打开配置文件文件夹
  const openConfigDir = async (): Promise<void> => {
    openConfigDirElectron();
  };

  // 打开可执行程序文件夹
  const openBinDir = () => {
    openBinDirElectron();
  };

  // 本地存储文件夹
  const localDir = async (): Promise<void> => {
    const { workspace } = settings;
    await openPath(workspace);
  };

  const { useProxy } = settings;

  return (
    <div className="setting-form">
      <ProForm<Settings>
        className={"setting-form-inner"}
        formRef={formRef}
        layout="horizontal"
        submitter={false}
        labelCol={{ style: { width: "130px" } }}
        labelAlign={"left"}
        size={"small"}
        colon={false}
        initialValues={settings}
        onValuesChange={async (changedValue) => {
          for (const key in changedValue) {
            if (changedValue.hasOwnProperty(key)) {
              const value = changedValue[key];
              await store.set(key, value);

              // 如果修改代理地址，关闭代理，可以手动打开
              if (key === "proxy" && useProxy) {
                await store.set("useProxy", false);
                const form = formRef.current;
                if (form != null) {
                  form.setFieldsValue({
                    ...settings,
                    useProxy: false,
                    proxy: value,
                  });
                }
              }
            }
          }
          dispatch(updateSettings({ ...settings, ...changedValue }));
        }}
      >
        <ProFormGroup label="基础设置" direction={"vertical"}>
          <ProFormText
            width="xl"
            disabled
            name="workspace"
            placeholder="请选择视频下载目录"
            label={
              <Button onClick={handleSelectDir} icon={<FolderOpenOutlined />}>
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
          />
          <ProFormSwitch
            name={"useProxy"}
            label={
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <div style={{ marginRight: "5px" }}>代理开关</div>
                <Tooltip
                  title={"该代理会对软件自带浏览器以及下载时生效"}
                  placement={"right"}
                >
                  <QuestionCircleOutlined />
                </Tooltip>
              </div>
            }
          >
            <Switch />
          </ProFormSwitch>
          <ProFormSwitch
            label={
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <div style={{ marginRight: "5px" }}>允许打点统计</div>
                <Tooltip title={statisticsTooltip} placement={"right"}>
                  <QuestionCircleOutlined />
                </Tooltip>
              </div>
            }
            name="statistics"
          />
        </ProFormGroup>
        <ProFormGroup label="下载设置" direction={"vertical"}>
          <ProFormSelect
            allowClear={false}
            width="xl"
            name="exeFile"
            label="默认下载器"
            placeholder="请选择执行程序"
            options={downloaderOptions}
          />
          <ProForm.Item label={"更多操作"}>
            <Space>
              <Button onClick={openConfigDir} icon={<FolderOpenOutlined />}>
                配置文件目录
              </Button>
              <Button onClick={openBinDir} icon={<FolderOpenOutlined />}>
                可执行程序目录
              </Button>
              <Button onClick={localDir} icon={<FolderOpenOutlined />}>
                本地存储目录
              </Button>
            </Space>
          </ProForm.Item>
          <ProForm.Item label={"当前版本"}>
            <div>{version}</div>
          </ProForm.Item>
        </ProFormGroup>
      </ProForm>
    </div>
  );
};

export default Setting;
