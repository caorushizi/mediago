import React, { FC, ReactNode, useEffect, useState } from "react";
import {
  Button,
  Form,
  message,
  Progress,
  Radio,
  RadioChangeEvent,
  Space,
  Tag,
  Popover,
  QRCode,
  Dropdown,
  Tooltip,
} from "antd";
import type { MenuProps } from "antd";
import "./index.scss";
import PageContainer from "../../components/PageContainer";
import { useAsyncEffect, usePagination } from "ahooks";
import useElectron from "../../hooks/electron";
import { DownloadStatus } from "../../types";
import { ModalForm, ProFormText, ProList } from "@ant-design/pro-components";
import {
  DownloadOutlined,
  EditOutlined,
  FolderOpenOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  MobileOutlined,
  MoreOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { selectAppStore } from "../../store";
import { tdApp } from "../../utils";
import { increase } from "../../store/downloadSlice";

enum DownloadFilter {
  list = "list",
  done = "done",
}

const HomePage: FC = () => {
  const {
    getDownloadItems,
    startDownload,
    rendererEvent,
    removeEventListener,
    openDir,
    stopDownload,
    onDownloadListContextMenu,
    deleteDownloadItem,
    convertToAudio,
    showBrowserWindow,
    addDownloadItem,
    editDownloadItem,
    openPlayerWindow,
    getLocalIP,
  } = useElectron();
  const dispatch = useDispatch();
  const appStore = useSelector(selectAppStore);
  const [filter, setFilter] = useState(DownloadFilter.list);
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
  const [addVideoForm] = Form.useForm<DownloadItem>();
  const [editVideoForm] = Form.useForm<DownloadItem>();
  const [baseUrl, setBaseUrl] = useState("");

  useAsyncEffect(async () => {
    const isDev = import.meta.env.MODE === "development";
    const localIP = await getLocalIP();
    const port = isDev ? 8556 : import.meta.env.APP_SERVER_PORT;
    setBaseUrl(`http://${localIP}:${port}/`);
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
    rendererEvent("download-progress", onDownloadProgress);
    rendererEvent("download-success", onDownloadSuccess);
    rendererEvent("download-failed", onDownloadFailed);
    rendererEvent("download-start", onDownloadStart);
    rendererEvent("download-item-event", onDownloadMenuEvent);
    rendererEvent("download-item-notifier", onReceiveDownloadItem);
    rendererEvent("change-video-is-live", onChangeVideoIsLive);

    return () => {
      removeEventListener("download-progress", onDownloadProgress);
      removeEventListener("download-success", onDownloadSuccess);
      removeEventListener("download-failed", onDownloadFailed);
      removeEventListener("download-start", onDownloadStart);
      removeEventListener("download-item-event", onDownloadMenuEvent);
      removeEventListener("download-item-notifier", onReceiveDownloadItem);
      removeEventListener("change-video-is-live", onChangeVideoIsLive);
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
      <ModalForm<DownloadItem>
        key="edit"
        title="编辑下载"
        width={500}
        onOpenChange={() => {
          editVideoForm.setFieldsValue(item);
        }}
        trigger={<Button type="text" icon={<EditOutlined />} />}
        form={editVideoForm}
        autoFocusFirstInput
        modalProps={{
          destroyOnClose: true,
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
          try {
            await editDownloadItem({
              id: item.id,
              name: values.name,
              url: values.url,
            });
            refresh();
            return true;
          } catch (err: any) {
            messageApi.error(err.message);
          }
        }}
      >
        <ProFormText
          name="name"
          label="标题"
          placeholder="请输入标题"
          rules={[
            {
              required: true,
              message: "请输入站点名称",
            },
          ]}
        />
        <ProFormText
          name="url"
          label="网址"
          placeholder="请输入网址"
          rules={[
            {
              required: true,
              message: "请输入站点网址",
            },
            {
              pattern: /^https?:\/\/.+/,
              message: "请输入正确的网址",
            },
          ]}
        />
      </ModalForm>
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
        icon={<FolderOpenOutlined />}
        title="打开文件位置"
        onClick={() => onOpenDir()}
      />,
      <Button
        type="text"
        key="redownload"
        title="重新下载"
        icon={<DownloadOutlined />}
        onClick={() => onStartDownload(item.id)}
      />,
      <Dropdown
        key="more"
        menu={{
          items: [
            {
              label: "播放视频",
              key: "play",
              icon: <PlayCircleOutlined />,
              disabled: curConverting,
            },
            {
              label: "转换为音频",
              key: "convert",
              icon: <SyncOutlined />,
            },
          ],
          onClick: ({ key }) => {
            if (key === "play") {
              openPlayerWindow(item.id);
            }
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
      tag = <Tag color="success">下载成功</Tag>;
    } else if (item.status === DownloadStatus.Failed) {
      tag = <Tag color="error">下载失败</Tag>;
    } else if (item.status === DownloadStatus.Stopped) {
      tag = <Tag color="default">下载暂停</Tag>;
    }
    return (
      <Space>
        {item.isLive && (
          <Tooltip placement="top" title="当前资源是直播资源">
            <SyncOutlined spin />
          </Tooltip>
        )}
        {item.name}
        {tag}
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

  const onFilterChange = (e: RadioChangeEvent) => {
    setFilter(e.target.value);
  };

  const onBatchDownload = async () => {
    for (const id of selectedRowKeys) {
      await startDownload(+id);
    }

    messageApi.success("添加任务成功");
    refresh();
    setSelectedRowKeys([]);
  };

  return (
    <PageContainer
      title="下载列表"
      titleExtra={
        <Radio.Group value={filter} onChange={onFilterChange}>
          <Radio.Button value="list">下载列表</Radio.Button>
          <Radio.Button value="done">下载完成</Radio.Button>
        </Radio.Group>
      }
      rightExtra={
        <Space>
          {appStore.openInNewWindow && (
            <Button type="primary" onClick={() => showBrowserWindow()}>
              打开浏览器
            </Button>
          )}
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
          <Button onClick={() => refresh()}>刷新</Button>
          <ModalForm<DownloadItem>
            title="新建下载"
            width={500}
            trigger={<Button>新建下载</Button>}
            form={addVideoForm}
            autoFocusFirstInput
            modalProps={{
              destroyOnClose: true,
            }}
            submitTimeout={2000}
            onFinish={async (values) => {
              await addDownloadItem({
                name: values.name,
                url: values.url,
              });
              refresh();
              return true;
            }}
          >
            <ProFormText
              name="name"
              label="标题"
              placeholder="请输入标题"
              rules={[
                {
                  required: true,
                  message: "请输入站点名称",
                },
              ]}
            />
            <ProFormText
              name="url"
              label="网址"
              placeholder="请输入网址"
              rules={[
                {
                  required: true,
                  message: "请输入站点网址",
                },
                {
                  pattern: /^https?:\/\/.+/,
                  message: "请输入正确的网址",
                },
              ]}
            />
          </ModalForm>
        </Space>
      }
      className="home-page"
    >
      {contextHolder}
      <ProList<DownloadItem>
        loading={loading}
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
        dataSource={data?.list}
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
                    await deleteDownloadItem(+id);
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
                    const ids = data?.list.map((item) => item.id);
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
