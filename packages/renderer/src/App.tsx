import React, { FC } from "react";
import { Link, Outlet } from "react-router-dom";
import { Layout, Menu, MenuProps } from "antd";
import "./App.scss";
import {
  AppstoreOutlined,
  CalendarOutlined,
  LinkOutlined,
  MailOutlined,
  SettingOutlined,
} from "@ant-design/icons";

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
  getItem(<Link to="/">下载列表</Link>, "home", <MailOutlined />),
  getItem(
    <Link to="/source-extract">素材提取</Link>,
    "source",
    <CalendarOutlined />
  ),
  getItem(<Link to="/settings">设置</Link>, "settings", <CalendarOutlined />),
];

const App: FC = () => {
  return (
    <Layout className="container">
      <Header className="container-header">Header</Header>
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
          <Footer className="container-footer">Footer</Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
