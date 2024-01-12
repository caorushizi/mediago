import React, { FC, ReactNode, useEffect, useState } from "react";
import {
  Button,
  message,
  Progress,
  Space,
  Tag,
  Popover,
  QRCode,
  Dropdown,
  Typography,
} from "antd";
import "./index.scss";
import PageContainer from "../../components/PageContainer";
import { useAsyncEffect, usePagination } from "ahooks";
import useElectron from "../../hooks/electron";
import { DownloadStatus, DownloadType } from "../../types";
import { ProList } from "@ant-design/pro-components";
import {
  DownloadOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  MobileOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectAppStore } from "../../store";
import { tdApp } from "../../utils";
import DownloadFrom from "../../components/DownloadForm";
import dayjs from "dayjs";
import classNames from "classnames";

const { Text } = Typography;

export enum DownloadFilter {
  list = "list",
  done = "done",
}

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
    openPlayerWindow,
    getLocalIP,
  } = useElectron();
  const appStore = useSelector(selectAppStore);
  const { data, loading, pagination, refresh } = usePagination(
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

  const [baseUrl, setBaseUrl] = useState("");

  useAsyncEffect(async () => {
    const localIP = await getLocalIP();
    setBaseUrl(`http://${localIP}:${import.meta.env.APP_SERVER_PORT}/`);
  }, []);

  const onDownloadProgress = (e: any, progress: DownloadProgress) => {
    setProgress((curProgress) => ({
      ...curProgress,
      [progress.id]: progress,
    }));
  };

  const onDownloadSuccess = () => {
    tdApp.downloadSuccess();
    refresh();
  };

  const onDownloadFailed = () => {
    tdApp.downloadFailed();
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
    tdApp.startDownload();
    await startDownload(id);
    messageApi.success("添加任务成功");
    refresh();
  };

  const onOpenDir = async () => {
    await openDir(appStore.local);
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
      messageApi.success("转换成功");
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
      <DownloadFrom
        key={"edit"}
        isEdit
        item={item}
        trigger={<Button type="text" icon={<EditOutlined />} />}
        onFinish={async (values) => {
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
      />
    );
  };

  const renderActionButtons = (
    dom: ReactNode,
    item: DownloadItem
  ): ReactNode => {
    if (item.status === DownloadStatus.Ready) {
      return [
        renderEditForm(item),
        <Button
          type="text"
          key="download"
          icon={<DownloadOutlined />}
          title="下载"
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Downloading) {
      return [
        <Button
          type="text"
          key="stop"
          title="暂停"
          icon={<PauseCircleOutlined />}
          onClick={() => onClickStopDownload(item)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Failed) {
      return [
        renderEditForm(item),
        <Button
          type="text"
          key="redownload"
          title="重新下载"
          icon={<DownloadOutlined />}
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }
    if (item.status === DownloadStatus.Watting) {
      return ["等待下载"];
    }
    if (item.status === DownloadStatus.Stopped) {
      return [
        renderEditForm(item),
        <Button
          type="text"
          key="restart"
          icon={<DownloadOutlined />}
          title="继续下载"
          onClick={() => onStartDownload(item.id)}
        />,
      ];
    }

    // 下载成功
    const curConverting = converting[item.id];
    return [
      <Button
        type="text"
        key="open-file"
        disabled={!item.exist}
        icon={<PlayCircleOutlined />}
        title="播放视频"
        onClick={() => openPlayerWindow(item.id)}
      />,
      <Dropdown
        key="more"
        menu={{
          items: [
            {
              label: "转换为音频",
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
        <Button type="text" title="更多" icon={<MoreOutlined />} />
      </Dropdown>,
    ];
  };

  const renderTitle = (dom: ReactNode, item: DownloadItem): ReactNode => {
    let tag = null;
    if (item.status === DownloadStatus.Downloading) {
      tag = (
        <Tag color="processing" icon={<SyncOutlined spin />}>
          下载中
        </Tag>
      );
    } else if (item.status === DownloadStatus.Success) {
      if (item.exist) {
        tag = <Tag color="success">下载成功</Tag>;
      } else {
        tag = <Tag color="default">文件不存在</Tag>;
      }
    } else if (item.status === DownloadStatus.Failed) {
      tag = <Tag color="error">下载失败</Tag>;
    } else if (item.status === DownloadStatus.Stopped) {
      tag = <Tag color="default">下载暂停</Tag>;
    }

    return (
      <Space>
        <Text
          className={classNames({
            "title-disabled":
              item.status === DownloadStatus.Success && !item.exist,
          })}
        >
          {item.name}
        </Text>
        <Space size={[0, 8]}>
          {tag}
          {item.isLive && <Tag color={"default"}>直播资源</Tag>}
        </Space>
      </Space>
    );
  };

  const renderDescription = (dom: ReactNode, item: DownloadItem): ReactNode => {
    if (progress[item.id] && filter === DownloadFilter.list) {
      const curProgress = progress[item.id];
      const { cur, total, speed } = curProgress;
      const percent = Math.round((Number(cur) / Number(total)) * 100);

      return (
        <Space.Compact className="download-progress description" block>
          <Progress percent={percent} />
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

    messageApi.success("添加任务成功");
    refresh();
    setSelectedRowKeys([]);
  };

  return (
    <PageContainer
      title={filter === DownloadFilter.list ? "下载列表" : "下载完成"}
      rightExtra={
        <Space>
          {filter === DownloadFilter.done && (
            <Popover
              placement="topRight"
              title={"扫码观看(需要连接相同 WIFI)"}
              content={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QRCode value={baseUrl} />
                </div>
              }
              trigger="click"
            >
              <Button icon={<MobileOutlined />}>手机上播放</Button>
            </Popover>
          )}
          {filter === DownloadFilter.done && (
            <Button onClick={() => openDir(appStore.local)}>打开文件夹</Button>
          )}
          {filter === DownloadFilter.list && appStore.openInNewWindow && (
            <Button type="primary" onClick={() => showBrowserWindow()}>
              打开浏览器
            </Button>
          )}
          {filter === DownloadFilter.list && (
            <Button onClick={() => refresh()}>刷新</Button>
          )}
          {filter === DownloadFilter.list && (
            <DownloadFrom
              trigger={<Button>新建下载</Button>}
              onFinish={async (values: any) => {
                if (values.batch) {
                  const { batchList = "" } = values;
                  const items = batchList.split("\n").map((item: any) => {
                    let [url, name] = item.split(" ");
                    url = url ? url.trim() : "";
                    name = name
                      ? name.trim()
                      : dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
                    return {
                      url,
                      name,
                      headers: values.headers,
                    };
                  });
                  await addDownloadItems(items);
                } else {
                  await addDownloadItem({
                    name: values.name || dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
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
            onContextMenu: (event) => {
              onDownloadListContextMenu(record.id);
            },
          };
        }}
        rowKey="id"
        rowSelection={rowSelection}
        dataSource={data?.list || []}
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
                删除
              </Button>
              <Button type="link" onClick={() => onCleanSelected()}>
                取消
              </Button>
              <Button type="link" onClick={onBatchDownload}>
                下载
              </Button>
            </>
          );
        }}
        tableAlertRender={({ selectedRows }) => {
          return (
            <>
              {data?.list.length !== 0 && (
                <Button
                  type="link"
                  onClick={() => {
                    const list = data?.list || [];
                    const ids = list.map((item) => item.id || 0);
                    if (ids) {
                      setSelectedRowKeys(ids);
                    }
                  }}
                >
                  全选
                </Button>
              )}
              {selectedRows.length !== 0 && (
                <span>已选择 {selectedRows.length} 项</span>
              )}
            </>
          );
        }}
      />
    </PageContainer>
  );
};

export default HomePage;
