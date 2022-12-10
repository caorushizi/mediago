import React, { FC } from "react";
import { Layout, Menu } from "antd";
import "./index.scss";
import { Link, Outlet } from "react-router-dom";

const { Header, Content } = Layout;

const pages = [
  { path: "/", name: "首页" },
  { path: "/collections", name: "收藏" },
  { path: "/settings", name: "设置" },
];

const Main: FC = () => {
  return (
    <Layout className={"layout-main"}>
      <Header className={"layout-main-header"}>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["0"]}
          items={pages.map((page, index) => ({
            key: index,
            label: <Link to={page.path}>{page.name}</Link>,
          }))}
        />
      </Header>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default Main;
