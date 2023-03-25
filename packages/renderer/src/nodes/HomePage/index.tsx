import React, { FC } from "react";
import { Button } from "antd";
import "./index.scss";
import PageContainer from "../../components/PageContainer";

const HomePage: FC = () => {
  return (
    <PageContainer
      title="下载列表"
      titleExtra="所有的视频将会在这里展示"
      rightExtra={<Button>新建下载</Button>}
      className="home-page"
    >
      Home
    </PageContainer>
  );
};

export default HomePage;
