import React, { FC, useEffect, useState } from "react";
import { Button, List, message, Progress } from "antd";
import "./index.scss";
import PageContainer from "../../components/PageContainer";
import { usePagination } from "ahooks";
import useElectron from "../../hooks/electron";
import { DownloadStatus } from "../../types";

const HomePage: FC = () => {
  const {
    getDownloadItems,
    startDownload,
    rendererEvent,
    removeEventListener,
  } = useElectron();
  const { data, loading, pagination } = usePagination(getDownloadItems, {
    defaultPageSize: 50,
  });
  const [progress, setProgress] = useState<Record<number, DownloadProgress>>(
    {}
  );

  const onDownloadProgress = (e: any, progress: DownloadProgress) => {
    console.log("progress: ", progress);
    setProgress({
      [progress.id]: progress,
    });
  };

  useEffect(() => {
    rendererEvent("download-progress", onDownloadProgress);

    return () => {
      removeEventListener("download-progress", onDownloadProgress);
    };
  }, []);

  const renderActionButtons = (item: DownloadItem) => {
    if (item.status === DownloadStatus.Ready) {
      return [
        <Button
          size="small"
          type="link"
          key="download"
          onClick={async () => {
            await startDownload(item.id);
            message.success("添加任务成功");
          }}
        >
          开始下载
        </Button>,
        <Button size="small" type="link" key="redownload">
          打开位置
        </Button>,
      ];
    }
    if (item.status === DownloadStatus.Downloading) {
      return [
        <Button size="small" type="link" key="reset">
          重置状态
        </Button>,
      ];
    }
    if (item.status === DownloadStatus.Failed) {
      return [
        <Button size="small" type="link" key="redownload">
          重新下载
        </Button>,
      ];
    }
    return [
      <Button size="small" type="link" key="redownload">
        打开位置
      </Button>,
      <Button size="small" type="link" key="redownload">
        打开位置
      </Button>,
    ];
  };

  const renderTitle = (item: DownloadItem) => {
    return item.name;
  };

  const renderDescription = (item: DownloadItem) => {
    if (progress[item.id]) {
      const curProgress = progress[item.id];
      const { cur, total } = curProgress;
      const percent = Math.round((Number(cur) / Number(total)) * 100);

      return <Progress percent={percent} />;
    }
    return item.url;
  };

  return (
    <PageContainer
      title="下载列表"
      rightExtra={<Button>新建下载</Button>}
      className="home-page"
    >
      <List<DownloadItem>
        pagination={pagination}
        dataSource={data?.list}
        loading={loading}
        renderItem={(item) => (
          <List.Item actions={renderActionButtons(item)}>
            <List.Item.Meta
              title={renderTitle(item)}
              description={renderDescription(item)}
            />
          </List.Item>
        )}
      />
    </PageContainer>
  );
};

export default HomePage;
