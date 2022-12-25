import ReactDOM from "react-dom";
import React, { FC, useState } from "react";
import { BrowserRouter as Router, NavLink } from "react-router-dom";
import { Route } from "react-router";
import { helpUrl, onEvent, tdApp } from "./utils";
import "antd/dist/reset.css";
import { Provider, useSelector } from "react-redux";
import BrowserPage from "./nodes/browser";
import MainPage from "./nodes/main";
import "./main.scss";
import store from "./store";
import { Badge, Button, Layout, Menu } from "antd";
import {
  ChromeOutlined,
  DownloadOutlined,
  LeftOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Settings from "./nodes/settings";
import { AppState } from "./store/reducers";
import { MainState } from "./store/actions/main.actions";
import WindowToolBar from "./components/WindowToolBar";

tdApp.init();

const { Header, Footer, Sider, Content } = Layout;

const Root: FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { notifyCount } = useSelector<AppState, MainState>(
    (state) => state.main
  );

  // 打开使用帮助
  const openHelp = (): void => {
    onEvent.mainPageHelp();
    void window.electron.openExternal(helpUrl);
  };

  return (
    <Router>
      <Layout className={"main-layout"}>
        <Header className={"main-header"}>
          <WindowToolBar
            color="#4090F7"
            onClose={() => {
              window.electron.closeMainWindow();
            }}
            onMinimize={() => {
              window.electron.minimize("main");
            }}
          />
        </Header>
        <Layout>
          <Sider collapsed={collapsed} className={"main-sider"}>
            <div
              className={"sider-collapsed"}
              onClick={() => {
                setCollapsed(!collapsed);
              }}
            >
              {!collapsed ? <LeftOutlined /> : <RightOutlined />}
            </div>
            <Menu
              defaultSelectedKeys={["/main"]}
              style={{ height: "100%", borderRight: 0 }}
            >
              <Menu.Item key="/main">
                <NavLink to="/main">
                  <DownloadOutlined />
                  <span>
                    下载
                    <Badge className="download-item" count={notifyCount} />
                  </span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="/browser">
                <NavLink to="/browser">
                  <ChromeOutlined />
                  <span>在线浏览</span>
                </NavLink>
              </Menu.Item>
              <Menu.Item key="/setting">
                <NavLink to="/setting">
                  <SettingOutlined />
                  <span>设置</span>
                </NavLink>
              </Menu.Item>
            </Menu>
          </Sider>
          <Content>
            <Route path="/main" component={MainPage} />
            <Route path="/browser" component={BrowserPage} />
            <Route path="/setting" component={Settings} />
          </Content>
        </Layout>
        <Footer className={"main-footer"}>
          <div className="toolbar">
            <Button
              type={"link"}
              onClick={openHelp}
              icon={<QuestionCircleOutlined />}
            >
              使用帮助
            </Button>
          </div>
        </Footer>
      </Layout>
    </Router>
  );
};

ReactDOM.render(
  <Provider store={store}>
    <Root />
  </Provider>,
  document.getElementById("root")
);
