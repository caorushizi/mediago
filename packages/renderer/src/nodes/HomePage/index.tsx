import { useRequest } from "ahooks";
import React, { FC } from "react";
import { Button } from "antd";
import useElectron from "../../hooks/electron";
import "./index.scss";
import PageContainer from "../../components/PageContainer";

const HomePage: FC = () => {
  const { index } = useElectron();
  const { data } = useRequest(index);

  return (
    <PageContainer
      title="下载列表"
      titleExtra="所有的视频将会在这里展示"
      rightExtra={<Button>新建下载</Button>}
      className="home-page"
    >
      <div>
        <ul>
          <li>{data?.binPath}</li>
          <li>{data?.dbPath}</li>
          <li>{data?.workspace}</li>
          <li>{data?.platform}</li>
        </ul>
      </div>
      <Button>按钮</Button>
    </PageContainer>
  );
};

export default HomePage;
