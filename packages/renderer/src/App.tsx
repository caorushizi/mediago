import React, { FC, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { Layout, Menu, MenuProps } from "antd";
import "./App.scss";
import {
  DownloadOutlined,
  ProfileOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import useElectron from "./hooks/electron";

const { Header, Footer, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem(<Link to="/">下载列表</Link>, "home", <DownloadOutlined />),
  getItem(
    <Link to="/source-extract">素材提取</Link>,
    "source",
    <ProfileOutlined />
  ),
  getItem(<Link to="/settings">设置</Link>, "settings", <SettingOutlined />),
];

const App: FC = () => {
  const { getAppStore } = useElectron();

  const initApp = async () => {
    const store = await getAppStore();
    console.log("store", store);
  };

  useEffect(() => {
    initApp();
  }, []);

  return (
    <Layout className="container">
      <Header className="container-header">Media Downloader</Header>
      <Layout>
        <Sider className="container-sider" theme="light">
          <Menu
            style={{ height: "100%" }}
            defaultSelectedKeys={["home"]}
            mode="vertical"
            theme="light"
            items={items}
          />
        </Sider>
        <Layout>
          <Content className="container-inner">
            <Outlet />
          </Content>
          <Footer className="container-footer">media-downloader</Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
