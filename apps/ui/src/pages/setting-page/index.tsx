import {
  ClearOutlined,
  CopyOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useMemoizedFn } from "ahooks";
import {
  App,
  Badge,
  Button,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Modal,
  Progress,
  Radio,
  Select,
  Space,
  Switch,
  Tabs,
  type TabsProps,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import PageContainer from "@/components/page-container";
import { CHECK_UPDATE } from "@/const";
import { usePlatform } from "@/hooks/use-platform";
import { useEnvPath } from "@/hooks/use-config";
import { setConfigValue } from "@/api/config";
import {
  exportFavorites as exportFavoritesApi,
  importFavorites,
} from "@/api/favorite";
import {
  appStoreSelector,
  setAppStoreSelector,
  useAppStore,
} from "@/store/app";
import { updateSelector, useSessionStore } from "@/store/session";
import { isWeb, tdApp } from "@/utils";
import { AppLanguage, AppStore, AppTheme } from "@mediago/shared-common";

const version = import.meta.env.APP_VERSION;

const SettingPage: React.FC = () => {
  const { dialog, shell, browser, contextMenu, update, on, off } =
    usePlatform();
  const { t } = useTranslation();
  const formRef = useRef<FormInstance<AppStore>>(null);
  const settings = useAppStore(useShallow(appStoreSelector));
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const { envPath } = useEnvPath();
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
    const paths = await dialog.open({ type: "directory" });
    const local = paths?.[0];
    if (local) {
      await setConfigValue("local", local);
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
      await Promise.all(
        Object.entries(values)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => setConfigValue(key, value)),
      );
      setAppStore(values);
    } catch (e: unknown) {
      message.error((e as Error).message);
    }
  });

  const onMenuClick = useMemoizedFn(async (_) => {
    try {
      const contents = await dialog.open({
        type: "file",
        filters: [{ name: "JSON", extensions: ["json"] }],
        readContent: true,
      });
      if (!contents?.length) return;
      const favorites = JSON.parse(contents[0]);
      if (Array.isArray(favorites)) {
        await importFavorites(favorites);
      }
      message.success(t("importFavoriteSuccess"));
    } catch {
      message.error(t("importFavoriteFailed"));
    }
  });

  const handleExportFavorite = useMemoizedFn(async () => {
    try {
      const content = await exportFavoritesApi();
      await dialog.save({
        content:
          typeof content === "string"
            ? content
            : JSON.stringify(content, null, 2),
        defaultPath: "favorites.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      message.success(t("exportFavoriteSuccess"));
    } catch {
      message.error(t("exportFavoriteFailed"));
    }
  });

  const handleCheckUpdate = useMemoizedFn(async () => {
    tdApp.onEvent(CHECK_UPDATE);
    setOpenUpdateModal(true);
    await update.check();
  });

  const handleHiddenUpdateModal = useMemoizedFn(() => {
    setOpenUpdateModal(false);
  });

  const handleUpdate = useMemoizedFn(() => {
    update.startDownload();
  });

  const handleInstallUpdate = useMemoizedFn(() => {
    update.install();
  });

  useEffect(() => {
    const onDownloadProgress = (
      _event: unknown,
      progress: { percent: number },
    ) => {
      setDownloadProgress(progress.percent);
    };
    const onDownloaded = () => {
      setUpdateDownloaded(true);
    };
    on("update:downloadProgress", onDownloadProgress);
    on("update:downloaded", onDownloaded);

    return () => {
      off("update:downloadProgress", onDownloadProgress);
      off("update:downloaded", onDownloaded);
    };
  }, []);

  const handleClearWebviewCache = useMemoizedFn(async () => {
    try {
      await browser.clearCache();
      message.success(t("clearCacheSuccess"));
    } catch {
      message.error(t("clearCacheFailed"));
    }
  });

  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: t("basicSetting"),
      children: (
        <>
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
          <Form.Item label={t("showTerminal")} name="showTerminal">
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
          <Form.Item
            label={t("enableMobilePlayer")}
            name="enableMobilePlayer"
            hidden={isWeb}
          >
            <Switch />
          </Form.Item>
        </>
      ),
    },
    {
      key: "2",
      disabled: isWeb,
      label: t("browserSetting"),
      children: !isWeb && (
        <>
          <Form.Item label={t("audioMuted")} name="audioMuted">
            <Switch />
          </Form.Item>
          <Form.Item label={t("openInNewWindow")} name="openInNewWindow">
            <Switch />
          </Form.Item>
          <Form.Item name="proxy" label={t("proxySetting")}>
            <Input
              width="xl"
              placeholder={t("pleaseEnterProxy")}
              onContextMenu={() =>
                contextMenu.show([
                  { key: "copy", label: t("copy") },
                  { key: "paste", label: t("paste") },
                ])
              }
            />
          </Form.Item>
          <Form.Item
            name="useProxy"
            label={t("proxySwitch")}
            rules={[
              {
                validator(rules, value) {
                  if (value && formRef.current?.getFieldValue("proxy") === "") {
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
              <Button onClick={handleExportFavorite}>
                <DownloadOutlined />
                {t("exportFavorite")}
              </Button>

              <Button onClick={onMenuClick}>
                <UploadOutlined />
                {t("importFavorite")}
              </Button>
            </Space>
          </Form.Item>
        </>
      ),
    },
    {
      key: "3",
      label: t("downloadSetting"),
      children: (
        <>
          <Form.Item hidden={!isWeb} name="proxy" label={t("proxySetting")}>
            <Input
              placeholder={t("pleaseEnterProxy")}
              onContextMenu={() =>
                contextMenu.show([
                  { key: "copy", label: t("copy") },
                  { key: "paste", label: t("paste") },
                ])
              }
            />
          </Form.Item>
          <Form.Item
            name="downloadProxySwitch"
            label={t("downloadProxySwitch")}
            rules={[
              {
                validator(rules, value) {
                  if (value && formRef.current?.getFieldValue("proxy") === "") {
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
        </>
      ),
    },
    {
      key: "4",
      label: t("dockerSetting"),
      disabled: isWeb,
      children: (
        <>
          <Form.Item name="apiKey" label={t("apiKey")}>
            <Input
              placeholder={t("pleaseEnterApiKey")}
              onContextMenu={() =>
                contextMenu.show([
                  { key: "copy", label: t("copy") },
                  { key: "paste", label: t("paste") },
                ])
              }
            />
          </Form.Item>
          <Form.Item name="dockerUrl" label={t("dockerUrl")}>
            <Input
              placeholder={t("pleaseEnterDockerUrl")}
              onContextMenu={() =>
                contextMenu.show([
                  { key: "copy", label: t("copy") },
                  { key: "paste", label: t("paste") },
                ])
              }
            />
          </Form.Item>
          <Form.Item label={t("enableDocker")} name="enableDocker">
            <Switch />
          </Form.Item>
        </>
      ),
    },
    {
      key: "5",
      label: t("skillsSetting"),
      children: (() => {
        const coreUrl = envPath?.playerUrl
          ? envPath.playerUrl.replace(/\/player\/$/, "")
          : "";
        const apiKey = settings.apiKey || "";
        let setupCmd: string;
        if (isWeb) {
          // Server/Docker mode: need both URL and API key
          const url = coreUrl || "http://localhost:8899";
          setupCmd = apiKey
            ? `设置 mediago 地址为 ${url}，api key 为 ${apiKey}`
            : `设置 mediago 地址为 ${url}`;
        } else {
          // Electron mode: only need URL
          setupCmd = coreUrl
            ? `设置 mediago 地址为 ${coreUrl}`
            : "设置 mediago 地址为 http://localhost:39719";
        }
        const installCmd = t("skillsInstallCmd");
        return (
          <>
            <Form.Item
              label={t("skillsInstall")}
              tooltip={t("skillsInstallTooltip")}
            >
              <Space.Compact className="w-full">
                <Input value={installCmd} readOnly className="font-mono" />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(installCmd);
                    message.success(t("skillsCopied"));
                  }}
                >
                  {t("skillsCopy")}
                </Button>
              </Space.Compact>
            </Form.Item>
            <Form.Item label={t("skillsInit")} tooltip={t("skillsInitTooltip")}>
              <Space.Compact className="w-full">
                <Input value={setupCmd} readOnly className="font-mono" />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(setupCmd);
                    message.success(t("skillsCopied"));
                  }}
                >
                  {t("skillsCopy")}
                </Button>
              </Space.Compact>
            </Form.Item>
          </>
        );
      })(),
    },
    {
      key: "6",
      label: t("moreSettings"),
      children: (
        <>
          <Form.Item hidden={!isWeb} name="apiKey" label={t("apiKey")}>
            <Input disabled />
          </Form.Item>
          <Form.Item hidden={isWeb} label={t("moreAction")}>
            <Space>
              <Button
                onClick={() =>
                  envPath?.configDir && shell.open(envPath.configDir)
                }
                icon={<FolderOpenOutlined />}
              >
                {t("configDir")}
              </Button>
              <Button
                onClick={() => envPath?.binDir && shell.open(envPath.binDir)}
                icon={<FolderOpenOutlined />}
              >
                {t("binPath")}
              </Button>
              <Button
                onClick={() => settings.local && shell.open(settings.local)}
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
        </>
      ),
    },
  ].filter((item) => !item.disabled);

  return (
    <PageContainer title={t("setting")}>
      <div className="rounded-lg bg-white px-3 py-2 dark:bg-[#1F2024] h-full">
        <Form<AppStore>
          ref={formRef}
          layout="horizontal"
          labelAlign={"left"}
          colon={false}
          initialValues={settings}
          onValuesChange={onFormValueChange}
          className="flex flex-col gap-2"
          // labelCol={{ span: 5 }}
          wrapperCol={{ span: 10 }}
        >
          <Tabs defaultActiveKey="1" items={tabItems} onChange={() => {}} />
        </Form>
      </div>

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
