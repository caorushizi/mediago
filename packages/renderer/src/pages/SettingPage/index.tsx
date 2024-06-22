import React, { useEffect, useRef } from "react";
import PageContainer from "../../components/PageContainer";
import {
  ProForm,
  ProFormText,
  ProFormGroup,
  ProFormSwitch,
  ProFormSelect,
  ProFormDigit,
} from "@ant-design/pro-components";
import "./index.scss";
import { Button, FormInstance, message, Space, Tooltip } from "antd";
import {
  ClearOutlined,
  FolderOpenOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { selectAppStore, setAppStore } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import useElectron from "../../hooks/electron";
import { useRequest } from "ahooks";
import { AppLanguage, AppTheme } from "../../types";
import { useTranslation } from "react-i18next";

const version = import.meta.env.APP_VERSION;

const SettingPage: React.FC = () => {
  const {
    onSelectDownloadDir,
    setAppStore: ipcSetAppStore,
    getEnvPath,
    openDir,
    clearWebviewCache,
  } = useElectron();
  const dispatch = useDispatch();
  const { t } = useTranslation();
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

  const renderButtonLabel = () => {
    return (
      <Button onClick={onSelectDir} icon={<FolderOpenOutlined />}>
        {t("selectFolder")}
      </Button>
    );
  };

  const renderTooltipLabel = (label: string, tooltip: string) => {
    return (
      <div className="item-label">
        <div className="item-label-text">{label}</div>
        <Tooltip title={tooltip} placement={"right"}>
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
    <PageContainer title={t("setting")}>
      <ProForm<AppStore>
        className={"setting-form-inner"}
        formRef={formRef}
        layout="horizontal"
        submitter={false}
        labelCol={{ style: { width: "140px" } }}
        labelAlign={"left"}
        colon={false}
        initialValues={settings}
        onValuesChange={onFormValueChange}
      >
        {contextHolder}
        <ProFormGroup title={t("basicSetting")} direction={"vertical"}>
          <ProFormText
            width="xl"
            disabled
            name="local"
            placeholder={t("pleaseSelectDownloadDir")}
            label={renderButtonLabel()}
          />
          <ProFormSelect
            name="theme"
            label={t("downloaderTheme")}
            valueEnum={{
              [AppTheme.System]: t("followSystem"),
              [AppTheme.Dark]: t("dark"),
              [AppTheme.Light]: t("light"),
            }}
            placeholder={t("pleaseSelectTheme")}
            allowClear={false}
          />
          <ProFormSelect
            name="language"
            label={t("displayLanguage")}
            valueEnum={{
              [AppLanguage.System]: t("followSystem"),
              [AppLanguage.ZH]: t("chinese"),
              [AppLanguage.EN]: t("english"),
            }}
            placeholder={t("pleaseSelectLanguage")}
            allowClear={false}
          />
          <ProFormSwitch label={t("openInNewWindow")} name="openInNewWindow" />
          <ProFormSwitch label={t("downloadPrompt")} name="promptTone" />
          <ProFormSwitch label={t("showTerminal")} name="showTerminal" />
          <ProFormSwitch
            label={renderTooltipLabel(
              t("autoUpgrade"),
              t("autoUpgradeTooltip")
            )}
            name="autoUpgrade"
          />
          {/* <ProFormSwitch label={t("privacy")} name="privacy" /> */}
        </ProFormGroup>
        <ProFormGroup title={t("browserSetting")} direction={"vertical"}>
          <ProFormText
            width="xl"
            name="proxy"
            placeholder={t("pleaseEnterProxy")}
            label={t("proxySetting")}
          />
          <ProFormSwitch
            name="useProxy"
            label={t("proxySwitch")}
            rules={[
              {
                validator(rules, value) {
                  if (value && formRef.current.getFieldValue("proxy") === "") {
                    return Promise.reject(t("pleaseEnterProxyFirst"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          />
          <ProFormSwitch label={t("blockAds")} name="blockAds" />
          <ProFormSwitch label={t("enterMobileMode")} name="isMobile" />
          <ProFormSwitch
            label={renderTooltipLabel(
              t("useImmersiveSniffing"),
              t("immersiveSniffingDescription")
            )}
            name="useExtension"
          />
          <ProFormText label={t("moreAction")}>
            <Space>
              <Button
                onClick={async () => {
                  try {
                    await clearWebviewCache();
                    messageApi.success(t("clearCacheSuccess"));
                  } catch (err) {
                    messageApi.error(t("clearCacheFailed"));
                  }
                }}
                icon={<ClearOutlined />}
              >
                {t("clearCache")}
              </Button>
            </Space>
          </ProFormText>
        </ProFormGroup>
        <ProFormGroup title={t("downloadSetting")} direction={"vertical"}>
          <ProFormSwitch
            name="downloadProxySwitch"
            label={t("downloadProxySwitch")}
            rules={[
              {
                validator(rules, value) {
                  if (value && formRef.current.getFieldValue("proxy") === "") {
                    return Promise.reject(t("pleaseEnterProxyFirst"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          />
          <ProFormSwitch label={t("deleteSegments")} name="deleteSegments" />
          <ProFormDigit
            label={renderTooltipLabel(
              t("maxRunner"),
              t("maxRunnerDescription")
            )}
            name="maxRunner"
            min={1}
            max={50}
            fieldProps={{ precision: 0 }}
          />
          <ProFormText label={t("moreAction")}>
            <Space>
              <Button
                onClick={() => openDir(envPath.workspace)}
                icon={<FolderOpenOutlined />}
              >
                {t("configDir")}
              </Button>
              <Button
                onClick={() => openDir(envPath.binPath)}
                icon={<FolderOpenOutlined />}
              >
                {t("binPath")}
              </Button>
              <Button
                onClick={() => openDir(settings.local)}
                icon={<FolderOpenOutlined />}
              >
                {t("localDir")}
              </Button>
            </Space>
          </ProFormText>
          <ProFormText label={t("currentVersion")}>
            <div>{version}</div>
          </ProFormText>
        </ProFormGroup>
      </ProForm>
    </PageContainer>
  );
};

export default SettingPage;
