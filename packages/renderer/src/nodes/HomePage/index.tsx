import React, { FC, useState } from "react";
import { Avatar, Button, List } from "antd";
import "./index.scss";
import PageContainer from "../../components/PageContainer";
import { usePagination } from "ahooks";
import useElectron from "../../hooks/electron";

const HomePage: FC = () => {
  const { getDownloadItems } = useElectron();
  const { data, loading, pagination } = usePagination(getDownloadItems);

  console.log("loading: ", loading);
  console.log("datra: ", data);

  return (
    <PageContainer
      title="下载列表"
      titleExtra="所有的视频将会在这里展示"
      rightExtra={<Button>新建下载</Button>}
      className="home-page"
    >
      <List<DownloadItem>
        pagination={pagination}
        dataSource={data?.list}
        loading={loading}
        renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta title={item.name} description={item.url} />
          </List.Item>
        )}
      />
    </PageContainer>
  );
};

export default HomePage;
