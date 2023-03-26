import React, { FC } from "react";
import { Link, Outlet } from "react-router-dom";
import { Badge, Button, Layout, Menu, MenuProps } from "antd";
import "./App.scss";
import {
  DownloadOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import useElectron from "./hooks/electron";
import { useDispatch, useSelector } from "react-redux";
import { setAppStore } from "./store/appSlice";
import { useAsyncEffect } from "ahooks";
import { clearCount, selectCount } from "./store/downloadSlice";

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
  const { getAppStore, openUrl } = useElectron();
  const dispatch = useDispatch();
  const count = useSelector(selectCount);

  const items: MenuItem[] = [
    getItem(
      <Link
        to="/"
        onClick={() => {
          dispatch(clearCount());
        }}
      >
        <DownloadOutlined />
        <span>下载列表</span>
        {count > 0 && (
          <Badge size="small" count={count} offset={[5, -3]}></Badge>
        )}
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
  const openHelpUrl = () => {
    const url =
      "https://blog.ziying.site/post/media-downloader-how-to-use/?form=client";
    openUrl(url);
  };

  useAsyncEffect(async () => {
    const store = await getAppStore();
    dispatch(setAppStore(store));
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
          <Footer className="container-footer">
            <Button
              size="small"
              type={"link"}
              onClick={openHelpUrl}
              icon={<QuestionCircleOutlined />}
            >
              使用帮助
            </Button>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
