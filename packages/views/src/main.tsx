import ReactDOM from "react-dom";
import React, { FC, useEffect, useState } from "react";
import { BrowserRouter as Router, NavLink } from "react-router-dom";
import { Route } from "react-router";
import { helpUrl, onEvent, tdApp } from "./utils";
import "antd/dist/reset.css";
import { Provider, useDispatch, useSelector } from "react-redux";
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
import SettingsPage from "./nodes/settings";
import { AppState } from "./store/reducers";
import { MainState, updateNotifyCount } from "./store/actions/main.actions";
import WindowToolBar from "./components/WindowToolBar";
import localforage from "localforage";

tdApp.init();

const { Header, Footer, Sider, Content } = Layout;

const { addEventListener, removeEventListener } = window.electron;

const initStatus = async (): Promise<void> => {
  const initCollapsed = await localforage.getItem("collapsed");

  const Root: FC = () => {
    const [collapsed, setCollapsed] = useState(Boolean(initCollapsed));
    const { notifyCount } = useSelector<AppState, MainState>(
      (state) => state.main
    );
    const dispatch = useDispatch();

    const handleWebViewMessage = (): void => {
      dispatch(updateNotifyCount(notifyCount + 1));
    };

    useEffect(() => {
      addEventListener("m3u8-notifier", handleWebViewMessage);

      return () => {
        removeEventListener("m3u8-notifier", handleWebViewMessage);
      };
    }, []);

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
                  setCollapsed((val) => {
                    void localforage.setItem("collapsed", !val);
                    return !val;
                  });
                }}
              >
                {!collapsed ? <LeftOutlined /> : <RightOutlined />}
              </div>
              <Menu
                defaultSelectedKeys={["/main"]}
                style={{ height: "100%", borderRight: 0 }}
              >
                <Menu.Item
                  key="/main"
                  icon={
                    <Badge
                      className="download-item"
                      dot
                      count={notifyCount}
                      offset={[0, 3]}
                    >
                      <DownloadOutlined />
                    </Badge>
                  }
                  title={null}
                >
                  <NavLink to="/main">
                    <span>下载</span>
                  </NavLink>
                </Menu.Item>
                <Menu.Item
                  key="/browser"
                  icon={<ChromeOutlined />}
                  title={null}
                >
                  <NavLink to="/browser">在线浏览</NavLink>
                </Menu.Item>
                <Menu.Item
                  key="/setting"
                  icon={<SettingOutlined />}
                  title={null}
                >
                  <NavLink to="/setting">设置</NavLink>
                </Menu.Item>
              </Menu>
            </Sider>
            <Content>
              <Route path="/main" component={MainPage} />
              <Route path="/browser" component={BrowserPage} />
              <Route path="/setting" component={SettingsPage} />
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
};

void initStatus();
