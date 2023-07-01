import React, { useEffect, useRef } from "react";
import PageContainer from "../../components/PageContainer";
import {
  ProForm,
  ProFormText,
  ProFormGroup,
  ProFormSwitch,
  ProFormSelect,
} from "@ant-design/pro-components";
import "./index.scss";
import { Button, FormInstance, message, Space, Tooltip } from "antd";
import { FolderOpenOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { selectAppStore, setAppStore } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import useElectron from "../../hooks/electron";
import { useRequest } from "ahooks";
import { AppTheme } from "../../types";

const version = import.meta.env.APP_VERSION;

const SettingPage: React.FC = () => {
  const {
    onSelectDownloadDir,
    setAppStore: ipcSetAppStore,
    getEnvPath,
    openDir,
  } = useElectron();
  const dispatch = useDispatch();
  const formRef = useRef<FormInstance<AppStore>>();
  const settings = useSelector(selectAppStore);
  const { data: envPath } = useRequest(getEnvPath);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    formRef.current?.setFieldsValue(settings);
  }, [settings]);

  const onSelectDir = async () => {
    const local = await onSelectDownloadDir();
    if (local) {
      dispatch(setAppStore({ local }));
      formRef.current?.setFieldValue("local", local);
    }
  };

  const renderButtonLable = () => {
    return (
      <Button onClick={onSelectDir} icon={<FolderOpenOutlined />}>
        选择文件夹
      </Button>
    );
  };

  const renderTooltipLable = () => {
    return (
      <div className="item-label">
        <div className="item-label-text">代理开关</div>
        <Tooltip
          title={"该代理会对软件自带浏览器以及下载时生效"}
          placement={"right"}
        >
          <QuestionCircleOutlined />
        </Tooltip>
      </div>
    );
  };

  const renderExtensionLabel = () => {
    return (
      <div className="item-label">
        <div className="item-label-text">使用浏览器插件</div>
        <Tooltip
          title={
            "开启后浏览器嗅探到的资源将不会直接显示在下载列表中，所有资源嗅探会交给浏览器插件处理"
          }
          placement={"right"}
        >
          <QuestionCircleOutlined />
        </Tooltip>
      </div>
    );
  };

  const onFormValueChange = async (values: Partial<AppStore>) => {
    try {
      for (const key of Object.keys(values)) {
        if (values[key] != null) {
          await ipcSetAppStore(key, values[key]);
        }
      }
      dispatch(setAppStore(values));
    } catch (e: any) {
      messageApi.error(e.message);
    }
  };

  return (
    <PageContainer title="设置">
      <ProForm<AppStore>
        className={"setting-form-inner"}
        formRef={formRef}
        layout="horizontal"
        submitter={false}
        labelCol={{ style: { width: "130px" } }}
        labelAlign={"left"}
        colon={false}
        initialValues={settings}
        onValuesChange={onFormValueChange}
      >
        {contextHolder}
        <ProFormGroup title="基础设置" direction={"vertical"}>
          <ProFormText
            width="xl"
            disabled
            name="local"
            placeholder="请选择视频下载目录"
            label={renderButtonLable()}
          />
          <ProFormSelect
            name="theme"
            label="下载器主题"
            valueEnum={{
              [AppTheme.System]: "跟随系统",
              [AppTheme.Dark]: "深色",
              [AppTheme.Light]: "浅色",
            }}
            placeholder="请选择主题色"
          />
          <ProFormSwitch label="新窗口打开浏览器" name="openInNewWindow" />
          <ProFormSwitch label="下载完成提示" name="promptTone" />
        </ProFormGroup>
        <ProFormGroup title="基础设置" direction={"vertical"}>
          <ProFormText
            width="xl"
            name="proxy"
            placeholder="请填写代理地址"
            label="代理设置"
          />
          <ProFormSwitch
            name="useProxy"
            label={renderTooltipLable()}
            rules={[
              ({ getFieldValue, setFieldValue }) => ({
                validator() {
                  if (getFieldValue("proxy") === "") {
                    setFieldValue("useProxy", false);
                    return Promise.reject("请先输入代理地址");
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          />
          <ProFormSwitch label="开启广告过滤" name="blockAds" />
          <ProFormSwitch label="以手机模式进入" name="isMobile" />
          <ProFormSwitch label={renderExtensionLabel()} name="useExtension" />
        </ProFormGroup>
        <ProFormGroup title="下载设置" direction={"vertical"}>
          <ProFormSwitch label="下载完成删除分片" name="deleteSegments" />
          <ProFormText label="更多操作">
            <Space>
              <Button
                onClick={() => envPath?.workspace && openDir(envPath.workspace)}
                icon={<FolderOpenOutlined />}
              >
                配置文件目录
              </Button>
              <Button
                onClick={() => envPath?.binPath && openDir(envPath.binPath)}
                icon={<FolderOpenOutlined />}
              >
                可执行程序目录
              </Button>
              <Button
                onClick={() => openDir(settings.local)}
                icon={<FolderOpenOutlined />}
              >
                本地存储目录
              </Button>
            </Space>
          </ProFormText>
          <ProFormText label="当前版本">
            <div>{version}</div>
          </ProFormText>
        </ProFormGroup>
      </ProForm>
    </PageContainer>
  );
};

export default SettingPage;
