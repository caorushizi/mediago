import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import PageContainer from "@/components/PageContainer";
import {
  App,
  Badge,
  Button,
  Dropdown,
  Form,
  FormInstance,
  Input,
  InputNumber,
  MenuProps,
  Modal,
  Progress,
  Radio,
  Select,
  Space,
  Switch,
} from "antd";
import {
  ClearOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  useAppStore,
  appStoreSelector,
  setAppStoreSelector,
} from "@/store/app";
import useElectron from "@/hooks/useElectron";
import { useMemoizedFn, useRequest } from "ahooks";
import { AppLanguage, AppTheme } from "@/types";
import { useTranslation } from "react-i18next";
import { updateSelector, useSessionStore } from "@/store/session";
import { useShallow } from "zustand/react/shallow";
import { isWeb, tdApp } from "@/utils";
import { CHECK_UPDATE } from "@/const";

const version = import.meta.env.APP_VERSION;

interface GroupWrapperProps extends PropsWithChildren {
  title: string;
  hidden?: boolean;
}

function GroupWrapper({ children, title, hidden }: GroupWrapperProps) {
  if (hidden) return null;

  return (
    <div className="rounded-lg bg-white px-3 py-2 dark:bg-[#1F2024]">
      <div className="mb-5 flex flex-row items-center gap-2">
        <div className="h-4 w-1 rounded-full bg-[#127AF3]" />
        {title}
      </div>
      {children}
    </div>
  );
}

const SettingPage: React.FC = () => {
  const {
    onSelectDownloadDir,
    setAppStore: ipcSetAppStore,
    getEnvPath,
    openDir,
    clearWebviewCache,
    exportFavorites,
    importFavorites,
    checkUpdate,
    startUpdate,
    addIpcListener,
    removeIpcListener,
    installUpdate,
  } = useElectron();
  const { t } = useTranslation();
  const formRef = useRef<FormInstance<AppStore>>();
  const settings = useAppStore(useShallow(appStoreSelector));
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const { data: envPath } = useRequest(getEnvPath);
  const { message } = App.useApp();
  const { updateAvailable, updateChecking } = useSessionStore(
    useShallow(updateSelector),
  );
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    formRef.current?.setFieldsValue(settings);
  }, [settings]);

  const onSelectDir = useMemoizedFn(async () => {
    const local = await onSelectDownloadDir();
    if (local) {
      setAppStore({ local });
      formRef.current?.setFieldValue("local", local);
    }
  });

  const renderButtonLabel = useMemoizedFn(() => {
    if (isWeb) {
      return t("localDir");
    }

    return (
      <Button onClick={onSelectDir} icon={<FolderOpenOutlined />}>
        {t("selectFolder")}
      </Button>
    );
  });

  const onFormValueChange = useMemoizedFn(async (values: Partial<AppStore>) => {
    try {
      for (const key of Object.keys(values)) {
        if (values[key] != null) {
          await ipcSetAppStore(key, values[key]);
        }
      }
      setAppStore(values);
    } catch (e: any) {
      message.error(e.message);
    }
  });

  const items = [
    {
      key: "1",
      label: (
        <Space>
          <UploadOutlined />
          {t("importFavorite")}
        </Space>
      ),
    },
  ];

  const onMenuClick: MenuProps["onClick"] = useMemoizedFn(async (e) => {
    const { key } = e;
    if (key === "1") {
      try {
        await importFavorites();
        message.success(t("importFavoriteSuccess"));
      } catch (e: any) {
        message.error(t("importFavoriteFailed"));
      }
    }
  });

  const handleExportFavorite = useMemoizedFn(async () => {
    try {
      await exportFavorites();
      message.success(t("exportFavoriteSuccess"));
    } catch (e: any) {
      message.error(t("exportFavoriteFailed"));
    }
  });

  const handleCheckUpdate = useMemoizedFn(async () => {
    tdApp.onEvent(CHECK_UPDATE);
    setOpenUpdateModal(true);
    await checkUpdate();
  });

  const handleHiddenUpdateModal = useMemoizedFn(() => {
    setOpenUpdateModal(false);
  });

  const handleUpdate = useMemoizedFn(() => {
    startUpdate();
  });

  const handleInstallUpdate = useMemoizedFn(() => {
    installUpdate();
  });

  useEffect(() => {
    const onDownloadProgress = (event: any, progress: any) => {
      setDownloadProgress(progress.percent);
    };
    const onDownloaded = () => {
      setUpdateDownloaded(true);
    };
    addIpcListener("updateDownloadProgress", onDownloadProgress);
    addIpcListener("updateDownloaded", onDownloaded);

    return () => {
      removeIpcListener("updateDownloadProgress", onDownloadProgress);
      removeIpcListener("updateDownloaded", onDownloaded);
    };
  }, []);

  const handleClearWebviewCache = useMemoizedFn(async () => {
    try {
      await clearWebviewCache();
      message.success(t("clearCacheSuccess"));
    } catch (err: any) {
      message.error(t("clearCacheFailed"));
    }
  });

  return (
    <PageContainer title={t("setting")}>
      <Form<AppStore>
        ref={formRef}
        layout="horizontal"
        labelAlign={"left"}
        colon={false}
        initialValues={settings}
        onValuesChange={onFormValueChange}
        className="flex flex-col gap-2"
        labelCol={{ span: 5 }}
        wrapperCol={{ span: 10 }}
      >
        <GroupWrapper title={t("basicSetting")}>
          <Form.Item name="local" label={renderButtonLabel()}>
            <Input
              width="xl"
              disabled
              placeholder={t("pleaseSelectDownloadDir")}
            />
          </Form.Item>
          <Form.Item hidden={isWeb} name="theme" label={t("downloaderTheme")}>
            <Select
              options={[
                { label: t("followSystem"), value: AppTheme.System },
                { label: t("dark"), value: AppTheme.Dark },
                { label: t("light"), value: AppTheme.Light },
              ]}
              placeholder={t("pleaseSelectTheme")}
              allowClear={false}
            />
          </Form.Item>
          <Form.Item name="language" label={t("displayLanguage")}>
            <Select
              options={[
                { label: t("followSystem"), value: AppLanguage.System },
                { label: t("chinese"), value: AppLanguage.ZH },
                { label: t("english"), value: AppLanguage.EN },
              ]}
              placeholder={t("pleaseSelectLanguage")}
              allowClear={false}
            />
          </Form.Item>
          <Form.Item
            hidden={isWeb}
            label={t("downloadPrompt")}
            name="promptTone"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            hidden={isWeb}
            label={t("showTerminal")}
            name="showTerminal"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            hidden={isWeb}
            label={t("autoUpgrade")}
            tooltip={t("autoUpgradeTooltip")}
            name="autoUpgrade"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            hidden={isWeb}
            label={t("allowBetaVersion")}
            name="allowBeta"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            hidden={isWeb}
            label={t("closeMainWindow")}
            name="closeMainWindow"
          >
            <Radio.Group>
              <Radio value={true}>{t("close")}</Radio>
              <Radio value={false}>{t("minimizeToTray")}</Radio>
            </Radio.Group>
          </Form.Item>
        </GroupWrapper>
        <GroupWrapper hidden={isWeb} title={t("browserSetting")}>
          <Form.Item label={t("audioMuted")} name="audioMuted">
            <Switch />
          </Form.Item>
          <Form.Item label={t("openInNewWindow")} name="openInNewWindow">
            <Switch />
          </Form.Item>
          <Form.Item name="proxy" label={t("proxySetting")}>
            <Input width="xl" placeholder={t("pleaseEnterProxy")} />
          </Form.Item>
          <Form.Item
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
          >
            <Switch />
          </Form.Item>
          <Form.Item label={t("blockAds")} name="blockAds">
            <Switch />
          </Form.Item>
          <Form.Item label={t("enterMobileMode")} name="isMobile">
            <Switch />
          </Form.Item>
          <Form.Item
            label={t("useImmersiveSniffing")}
            tooltip={t("immersiveSniffingDescription")}
            name="useExtension"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={t("privacy")}
            tooltip={t("privacyTooltip")}
            name="privacy"
          >
            <Switch />
          </Form.Item>
          <Form.Item label={t("moreAction")}>
            <Space>
              <Button
                onClick={handleClearWebviewCache}
                icon={<ClearOutlined />}
              >
                {t("clearCache")}
              </Button>
              <Dropdown.Button
                menu={{ items, onClick: onMenuClick }}
                onClick={handleExportFavorite}
              >
                <DownloadOutlined />
                {t("exportFavorite")}
              </Dropdown.Button>
            </Space>
          </Form.Item>
        </GroupWrapper>
        <GroupWrapper title={t("downloadSetting")}>
          <Form.Item hidden={!isWeb} name="proxy" label={t("proxySetting")}>
            <Input placeholder={t("pleaseEnterProxy")} />
          </Form.Item>
          <Form.Item
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
          >
            <Switch />
          </Form.Item>
          <Form.Item label={t("deleteSegments")} name="deleteSegments">
            <Switch />
          </Form.Item>
          <Form.Item
            label={t("maxRunner")}
            tooltip={t("maxRunnerDescription")}
            name="maxRunner"
          >
            <InputNumber min={1} max={50} precision={0} />
          </Form.Item>
          <Form.Item hidden={isWeb} label={t("moreAction")}>
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
          </Form.Item>
          <Form.Item label={t("currentVersion")}>
            <Space>
              <div>{version}</div>
              {!isWeb && (
                <Badge dot={updateAvailable}>
                  <Button type="text" onClick={handleCheckUpdate}>
                    {t("checkUpdate")}
                  </Button>
                </Badge>
              )}
            </Space>
          </Form.Item>
        </GroupWrapper>
        <GroupWrapper title={t("dockerSetting")}>
          <Form.Item hidden={isWeb} name="dockerUrl" label={t("dockerUrl")}>
            <Input placeholder={t("pleaseEnterDockerUrl")} />
          </Form.Item>
          <Form.Item label={t("enableDocker")} name="enableDocker">
            <Switch />
          </Form.Item>
        </GroupWrapper>
      </Form>

      <Modal
        title={t("updateModal")}
        open={openUpdateModal}
        onCancel={handleHiddenUpdateModal}
        footer={
          updateAvailable
            ? [
                <Button key="hidden" onClick={handleHiddenUpdateModal}>
                  {t("close")}
                </Button>,
                updateDownloaded ? (
                  <Button
                    key="install"
                    type="primary"
                    onClick={handleInstallUpdate}
                  >
                    {t("install")}
                  </Button>
                ) : (
                  <Button key="update" type="primary" onClick={handleUpdate}>
                    {t("update")}
                  </Button>
                ),
              ]
            : [
                <Button key="hidden" onClick={handleHiddenUpdateModal}>
                  {t("close")}
                </Button>,
              ]
        }
      >
        <div className="flex min-h-28 flex-col justify-center">
          {updateChecking
            ? t("checkingForUpdates")
            : updateAvailable
              ? t("updateAvailable")
              : t("updateNotAvailable")}
          {!updateChecking && updateAvailable && (
            <Progress percent={updateDownloaded ? 100 : downloadProgress} />
          )}
        </div>
      </Modal>
    </PageContainer>
  );
};

export default SettingPage;
