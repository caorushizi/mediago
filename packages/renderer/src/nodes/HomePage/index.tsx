import { useRequest } from "ahooks";
import React, { FC } from "react";
import { Button } from "antd";
import useElectron from "../../hooks/electron";
import "./index.scss";

const HomePage: FC = () => {
  const { index } = useElectron();
  const { data } = useRequest(index);

  return (
    <div className="home-page">
      <div>
        <ul>
          <li>{data?.binPath}</li>
          <li>{data?.dbPath}</li>
          <li>{data?.workspace}</li>
          <li>{data?.platform}</li>
        </ul>
      </div>
      <Button>按钮</Button>
    </div>
  );
};

export default HomePage;
