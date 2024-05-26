import React, { FC, ReactNode, useEffect, useState } from "react";
import {
  Button,
  message,
  Progress,
  Space,
  Tag,
  Dropdown,
  Typography,
} from "antd";
import "./index.scss";
import PageContainer from "../../components/PageContainer";
import { usePagination } from "ahooks";
import useElectron from "../../hooks/electron";
import { DownloadFilter, DownloadStatus, DownloadType } from "../../types";
import { ProList } from "@ant-design/pro-components";
import {
  DownloadOutlined,
  EditOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  MoreOutlined,
  CodeOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectAppStore } from "../../store";
import DownloadForm from "../../components/DownloadForm";
import { Trans, useTranslation } from "react-i18next";
import Terminal from "../../components/Terminal";
import { moment } from "../../utils";

const { Text } = Typography;

interface Props {
  filter?: DownloadFilter;
}

const HomePage: FC<Props> = ({ filter = DownloadFilter.list }) => {
  const {
    getDownloadItems,
    startDownload,
    addIpcListener,
    removeIpcListener,
    openDir,
    stopDownload,
    onDownloadListContextMenu,
    deleteDownloadItem,
    convertToAudio,
    showBrowserWindow,
    addDownloadItem,
    addDownloadItems,
    editDownloadItem,
    getDownloadLog,
  } = useElectron();
  const appStore = useSelector(selectAppStore);
  const { t } = useTranslation();
  const {
    data = { total: 0, list: [] },
    loading,
    pagination,
    refresh,
  } = usePagination(
    ({ current, pageSize }) => {
      return getDownloadItems({
        current,
        pageSize,
        filter,
      });
    },
    {
      defaultPageSize: 50,
      refreshDeps: [filter],
    }
  );
  const [converting, setConverting] = useState<Record<number, boolean>>({});
  const [progress, setProgress] = useState<Record<number, DownloadProgress>>(
    {}
  );
  const [messageApi, contextHolder] = message.useMessage();
  const [terminal, setTerminal] = useState({
    title: "",
    id: 0,
    log: "",
  });

  const onDownloadProgress = (e: unknown, progress: DownloadProgress) => {
    setProgress((curProgress) => ({
      ...curProgress,
      [progress.id]: progress,
    }));
  };

  const onDownloadSuccess = () => {
    refresh();
  };

  const onDownloadFailed = () => {
    refresh();
  };

  const onDownloadStart = () => {
    refresh();
  };

  const onDownloadMenuEvent = async (
    e: any,
    params: { action: string; payload: number }
  ) => {
    const { action, payload } = params;

    if (action === "select") {
      setSelectedRowKeys((keys) => [...keys, payload]);
    } else if (action === "download") {
      onStartDownload(payload);
    } else if (action === "refresh") {
      refresh();
    } else if (action === "delete") {
      await deleteDownloadItem(payload);
      refresh();
    }
  };

  const onReceiveDownloadItem = () => {
    refresh();
  };

  const onChangeVideoIsLive = () => {
    refresh();
  };

  useEffect(() => {
    addIpcListener("download-progress", onDownloadProgress);
    addIpcListener("download-success", onDownloadSuccess);
    addIpcListener("download-failed", onDownloadFailed);
    addIpcListener("download-start", onDownloadStart);
    addIpcListener("download-item-event", onDownloadMenuEvent);
    addIpcListener("download-item-notifier", onReceiveDownloadItem);
    addIpcListener("change-video-is-live", onChangeVideoIsLive);

    return () => {
      removeIpcListener("download-progress", onDownloadProgress);
      removeIpcListener("download-success", onDownloadSuccess);
      removeIpcListener("download-failed", onDownloadFailed);
      removeIpcListener("download-start", onDownloadStart);
      removeIpcListener("download-item-event", onDownloadMenuEvent);
      removeIpcListener("download-item-notifier", onReceiveDownloadItem);
      removeIpcListener("change-video-is-live", onChangeVideoIsLive);
    };
  }, []);

  const onStartDownload = async (id: number) => {
    await startDownload(id);
    messageApi.success(t("addTaskSuccess"));
    refresh();
  };

  const onClickStopDownload = async (item: DownloadItem) => {
    await stopDownload(item.id);
    refresh();
  };

  const onClickConvertToAudio = async (item: DownloadItem) => {
    setConverting((curConverting) => ({
      ...curConverting,
      [item.id]: true,
    }));
    try {
      await convertToAudio(item.id);
      messageApi.success(t("convertSuccess"));
    } catch (e: any) {
      messageApi.error(e.message);
    } finally {
      setConverting((curConverting) => ({
        ...curConverting,
        [item.id]: false,
      }));
    }
  };

  const renderEditForm = (item: DownloadItem) => {
    return (
      <DownloadForm
        key={"edit"}
        isEdit
        item={item}
        trigger={
          <Button type="text" title={t("edit")} icon={<EditOutlined />} />
        }
        onDownloadNow={async (values) => {
          try {
            await editDownloadItem({
              id: item.id,
              name: values.name,
              url: values.url,
              headers: values.headers,
              type: DownloadType.m3u8,
            });
            refresh();
            return true;
          } catch (err: any) {
            messageApi.error(err.message);
          }
        }}
        onAddToList={async () => {}}
      />
    );
  };

  const renderTerminalBtn = (item: DownloadItem) => {
    if (!appStore.showTerminal) return null;

    return (
      <Button
        key="terminal"
        type={terminal.id === item.id ? "primary" : "text"}
        title={t("terminal")}
        icon={<CodeOutlined />}
        onClick={() => {
          if (terminal.id !== item.id) {
            showTerminal(item);
          }
        }}
      />
    );
  };

  const showTerminal = async (item: DownloadItem) => {
    const log = await getDownloadLog(item.id);
    setTerminal({
      title: item.name,
      id: item.id,
      log,
    });
  };

  const renderActionButtons = (
    dom: ReactNode,
    item: DownloadItem
  ): ReactNode => {
    if (item.status === DownloadStatus.Ready) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <Button
          type="text"
          key="download"
          icon={<DownloadOutlined />}
          title={t("download")}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Downloading) {
      return [
        renderTerminalBtn(item),
        <Button
          type="text"
          key="stop"
          title={t("pause")}
          icon={<PauseCircleOutlined />}
          onClick={() => onClickStopDownload(item)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Failed) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <Button
          type="text"
          key="redownload"
          title={t("redownload")}
          icon={<DownloadOutlined />}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Watting) {
      return [t("watting")];
    }
    if (item.status === DownloadStatus.Stopped) {
      return [
        renderTerminalBtn(item),
        renderEditForm(item),
        <Button
          type="text"
          key="restart"
          icon={<DownloadOutlined />}
          title={t("continueDownload")}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }

    // 下载成功
    const curConverting = converting[item.id];
    return [
      <Dropdown
        key="more"
        menu={{
          items: [
            {
              label: t("convertToAudio"),
              key: "convert",
              icon: <SyncOutlined />,
              disabled: curConverting,
            },
          ],
          onClick: ({ key }) => {
            if (key === "convert") {
              onClickConvertToAudio(item);
            }
          },
        }}
      >
        <Button type="text" title={t("more")} icon={<MoreOutlined />} />
      </Dropdown>,
    ];
  };

  const renderTitle = (dom: ReactNode, item: DownloadItem): ReactNode => {
    let tag = null;
    if (item.status === DownloadStatus.Downloading) {
      tag = (
        <Tag color="processing" icon={<SyncOutlined spin />}>
          {t("downloading")}
        </Tag>
      );
    } else if (item.status === DownloadStatus.Success) {
      tag = <Tag color="success">{t("downloadSuccess")}</Tag>;
    } else if (item.status === DownloadStatus.Failed) {
      tag = <Tag color="error">{t("downloadFailed")}</Tag>;
    } else if (item.status === DownloadStatus.Stopped) {
      tag = <Tag color="default">{t("downloadPause")}</Tag>;
    }

    return (
      <Space>
        <Text>{item.name}</Text>
        <Space size={[0, 8]}>
          {tag}
          {item.isLive && <Tag color={"default"}>{t("liveResource")}</Tag>}
        </Space>
      </Space>
    );
  };

  const renderDescription = (dom: ReactNode, item: DownloadItem): ReactNode => {
    if (progress[item.id] && filter === DownloadFilter.list && !item.isLive) {
      const curProgress = progress[item.id];
      const { percent, speed } = curProgress;

      return (
        <Space.Compact className="download-progress description" block>
          <Progress
            percent={Math.round(Number(percent))}
            strokeLinecap="butt"
          />
          <div className="progress-speed">{speed}</div>
        </Space.Compact>
      );
    }
    return <div className="description">{item.url}</div>;
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const rowSelection = {
    selectedRowKeys,
    alwaysShowAlert: true,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const onBatchDownload = async () => {
    for (const id of selectedRowKeys) {
      await startDownload(Number(id));
    }

    messageApi.success(t("addTaskSuccess"));
    refresh();
    setSelectedRowKeys([]);
  };

  return (
    <PageContainer
      title={
        filter === DownloadFilter.list
          ? t("downloadList")
          : t("downloadComplete")
      }
      rightExtra={
        <Space>
          {filter === DownloadFilter.list && appStore.openInNewWindow && (
            <Button type="primary" onClick={() => showBrowserWindow()}>
              {t("openBrowser")}
            </Button>
          )}
          {filter === DownloadFilter.list && (
            <Button onClick={() => refresh()}>{t("refresh")}</Button>
          )}
          <Button onClick={() => openDir(appStore.local)}>
            {t("openFolder")}
          </Button>
          {filter === DownloadFilter.list && (
            <DownloadForm
              trigger={
                <Button icon={<FileAddOutlined />}>{t("newDownload")}</Button>
              }
              onAddToList={async () => {}}
              onDownloadNow={async (values: any) => {
                if (values.batch) {
                  const { batchList = "" } = values;
                  const items = batchList.split("\n").map((item: any) => {
                    let [url, name] = item.split(" ");
                    url = url ? url.trim() : "";
                    name = name ? name.trim() : moment();
                    return {
                      url,
                      name,
                      headers: values.headers,
                    };
                  });
                  await addDownloadItems(items);
                } else {
                  await addDownloadItem({
                    name: values.name || moment(),
                    url: values.url,
                    headers: values.headers,
                    type: DownloadType.m3u8,
                  });
                }

                refresh();
                return true;
              }}
            />
          )}
        </Space>
      }
      className="home-page"
    >
      {contextHolder}
      <ProList<DownloadItem>
        loading={loading}
        className="download-list"
        pagination={pagination}
        metas={{
          title: {
            render: renderTitle,
          },
          description: {
            render: renderDescription,
          },
          actions: {
            render: renderActionButtons,
          },
        }}
        onRow={(record) => {
          return {
            onContextMenu: () => {
              onDownloadListContextMenu(record.id);
            },
          };
        }}
        rowKey="id"
        rowSelection={rowSelection}
        dataSource={data.list || []}
        tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => {
          if (selectedRowKeys.length === 0) {
            return null;
          }

          return (
            <>
              <Button
                type="link"
                onClick={async () => {
                  for (const id of selectedRowKeys) {
                    await deleteDownloadItem(Number(id));
                  }
                  setSelectedRowKeys([]);
                  refresh();
                }}
              >
                {t("delete")}
              </Button>
              <Button type="link" onClick={() => onCleanSelected()}>
                {t("cancel")}
              </Button>
              <Button type="link" onClick={onBatchDownload}>
                {t("download")}
              </Button>
            </>
          );
        }}
        tableAlertRender={({ selectedRows }) => {
          return (
            <>
              {data.list.length !== 0 && (
                <Button
                  type="link"
                  onClick={() => {
                    const list = data.list || [];
                    const ids = list.map((item) => item.id || 0);
                    if (ids) {
                      setSelectedRowKeys(ids);
                    }
                  }}
                >
                  {t("selectAll")}
                </Button>
              )}
              {selectedRows.length !== 0 && (
                <span>
                  <Trans
                    i18nKey="selectedItems"
                    values={{ count: selectedRows.length }}
                  />
                </span>
              )}
            </>
          );
        }}
      />
      {filter === DownloadFilter.list && appStore.showTerminal && (
        <Terminal
          className="home-page-terminal"
          title={terminal.title}
          id={terminal.id}
          log={terminal.log}
        />
      )}
    </PageContainer>
  );
};

export default HomePage;
