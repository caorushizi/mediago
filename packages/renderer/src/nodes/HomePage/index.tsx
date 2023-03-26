import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import { message, Progress, Radio, RadioChangeEvent, Space, Tag } from "antd";
import "./index.scss";
import PageContainer from "../../components/PageContainer";
import { usePagination } from "ahooks";
import useElectron from "../../hooks/electron";
import { DownloadStatus } from "../../types";
import { ProList } from "@ant-design/pro-components";
import { SyncOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectStore } from "../../store/appSlice";
import { tdApp } from "../../utils";

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
  } = useElectron();
  const appStore = useSelector(selectStore);
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
  const [progress, setProgress] = useState<Record<number, DownloadProgress>>(
    {}
  );
  const curProgress = useRef<Record<string, DownloadProgress>>({});

  const onDownloadProgress = (e: any, p: DownloadProgress) => {
    curProgress.current[p.id] = p;
    setProgress({ ...curProgress.current });
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

  useEffect(() => {
    rendererEvent("download-progress", onDownloadProgress);
    rendererEvent("download-success", onDownloadSuccess);
    rendererEvent("download-failed", onDownloadFailed);
    rendererEvent("download-start", onDownloadStart);

    return () => {
      removeEventListener("download-progress", onDownloadProgress);
      removeEventListener("download-success", onDownloadSuccess);
      removeEventListener("download-failed", onDownloadFailed);
      removeEventListener("download-start", onDownloadStart);
    };
  }, []);

  const onStartDownload = async (item: DownloadItem) => {
    tdApp.startDownload();
    await startDownload(item.id);
    message.success("添加任务成功");
    refresh();
  };

  const onOpenDir = async () => {
    await openDir(appStore.local);
  };

  const renderActionButtons = (
    dom: ReactNode,
    item: DownloadItem
  ): ReactNode => {
    if (item.status === DownloadStatus.Ready) {
      return [
        <a key="download" onClick={() => onStartDownload(item)}>
          开始下载
        </a>,
      ];
    }
    if (item.status === DownloadStatus.Downloading) {
      return [];
    }
    if (item.status === DownloadStatus.Failed) {
      return [
        <a key="redownload" onClick={() => onStartDownload(item)}>
          重新下载
        </a>,
      ];
    }
    if (item.status === DownloadStatus.Watting) {
      return ["等待下载"];
    }
    return [
      <a key="redownload" onClick={onOpenDir}>
        打开位置
      </a>,
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
    }
    return (
      <Space>
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
        <Space.Compact className="download-progress" block>
          <Progress percent={percent} />
          <div className="progress-speed">{speed}</div>
        </Space.Compact>
      );
    }
    return <div className="description">{item.url}</div>;
  };

  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(
    []
  );
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: (string | number)[]) => setSelectedRowKeys(keys),
  };

  const onFilterChange = (e: RadioChangeEvent) => {
    setFilter(e.target.value);
  };

  return (
    <PageContainer
      title="下载列表"
      titleExtra={
        <Radio.Group size="small" value={filter} onChange={onFilterChange}>
          <Radio.Button value="list">下载列表</Radio.Button>
          <Radio.Button value="done">下载完成</Radio.Button>
        </Radio.Group>
      }
      className="home-page"
    >
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
        rowKey="id"
        rowSelection={rowSelection}
        dataSource={data?.list}
      />
    </PageContainer>
  );
};

export default HomePage;
