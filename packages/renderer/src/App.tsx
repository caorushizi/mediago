import React, { FC, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { Avatar, Badge, Layout, Menu, MenuProps } from "antd";
import "./App.scss";
import {
  DownloadOutlined,
  ProfileOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import useElectron from "./hooks/electron";
import { useDispatch } from "react-redux";
import { setAppStore } from "./store/appSlice";

const { Header, Footer, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode
): MenuItem {
  return {
    key,
    icon,
    label,
  };
}

const App: FC = () => {
  const { getAppStore } = useElectron();
  const dispatch = useDispatch();

  const initApp = async () => {
    const store = await getAppStore();
    dispatch(setAppStore(store));
  };

  const items: MenuItem[] = [
    getItem(
      <Link to="/">
        <DownloadOutlined />
        <span>下载列表</span>
        <Badge size="small" dot offset={[0, -8]}></Badge>
      </Link>,
      "home"
    ),
    getItem(
      <Link to="/source-extract">
        <ProfileOutlined />
        <span>素材提取</span>
      </Link>,
      "source"
    ),
    getItem(
      <Link to="/settings">
        <SettingOutlined />
        <span>设置</span>
      </Link>,
      "settings"
    ),
  ];

  useEffect(() => {
    initApp();
  }, []);

  return (
    <Layout className="container">
      {/* <Header className="container-header">Media Downloader</Header> */}
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
