import React, { FC, useEffect, useRef, useState } from "react";
import { Button, FormInstance, Space, Switch, Tooltip } from "antd";
import "./index.scss";
import ProForm, {
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-form";
import { FolderOpenOutlined } from "@ant-design/icons";
import { AppState } from "renderer/store/reducers";
import {
  Settings,
  updateSettings,
} from "renderer/store/actions/settings.actions";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@chakra-ui/react";
import { version } from "../../../../../../package.json";
import { downloaderOptions } from "renderer/utils/variables";

interface FormData {
  exeFile: string;
  workspace: string;
  tip: boolean;
  proxy: string;
}

// 设置页面
const Setting: FC = () => {
  const settings = useSelector<AppState, Settings>((state) => state.settings);
  const dispatch = useDispatch();
  const formRef = useRef<FormInstance<FormData>>();
  const [proxyChecked, setProxyChecked] = useState<boolean>(false);

  useEffect(() => {
    const { useProxy } = settings;
    setProxyChecked(useProxy);
  }, []);

  // 选择下载地址
  const handleSelectDir = async (): Promise<void> => {
    const defaultPath = await window.electron.getPath("documents");
    const { filePaths } = await window.electron.showOpenDialog({
      defaultPath,
      properties: ["openDirectory"],
    });
    // 没有返回值
    if (!filePaths) return;
    // 返回值为空
    if (Array.isArray(filePaths) && filePaths.length <= 0) return;
    const workspaceValue = filePaths[0];
    await window.electron.store.set("workspace", workspaceValue);
    formRef.current?.setFieldsValue({
      workspace: workspaceValue || "",
    });

    dispatch(updateSettings({ workspace: workspaceValue }));
  };

  // 打开配置文件文件夹
  const openConfigDir = async (): Promise<void> => {
    window.electron.openConfigDir();
  };

  // 打开可执行程序文件夹
  const openBinDir = () => {
    window.electron.openBinDir();
  };

  // 本地存储文件夹
  const localDir = async (): Promise<void> => {
    const { workspace } = settings;
    window.electron.openPath(workspace);
  };

  // 更改代理设置
  const toggleProxySetting = async (enableProxy: boolean): Promise<void> => {
    setProxyChecked(enableProxy);
    await window.electron.store.set("useProxy", enableProxy);
  };

  const { workspace, exeFile, tip, proxy } = settings;

  return (
    <Box className="setting-form">
      <ProForm<FormData>
        formRef={formRef}
        layout="horizontal"
        submitter={false}
        initialValues={{ workspace, exeFile, tip, proxy }}
        onValuesChange={async (changedValue) => {
          if (Object.keys(changedValue).includes("tip")) {
            await window.electron.store.set("tip", changedValue["tip"]);
          }
          if (Object.keys(changedValue).includes("exeFile")) {
            const value = changedValue["exeFile"];
            await window.electron.store.set("exeFile", value);
            dispatch(updateSettings({ exeFile: value }));
          }
          // 代理 onchange 事件
          if (Object.keys(changedValue).includes("proxy")) {
            const value = changedValue["proxy"];
            await window.electron.store.set("proxy", value);
            if (proxyChecked) {
              await toggleProxySetting(false);
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
            fieldProps={{
              addonAfter: (
                <Tooltip title="该代理会对软件自带浏览器以及下载时生效">
                  <Switch
                    checked={proxyChecked}
                    checkedChildren="代理生效"
                    unCheckedChildren="代理关闭"
                    onChange={toggleProxySetting}
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
              <div>当前版本：{version}</div>
            </Space>
          </ProForm.Item>
        </ProFormGroup>
      </ProForm>
    </Box>
  );
};

export default Setting;
