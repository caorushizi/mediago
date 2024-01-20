import React, { FC, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Layout, Menu, MenuProps } from "antd";
import "./index.scss";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ExportOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import useElectron from "../../hooks/electron";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAppStore,
  setAppStore,
  clearCount,
  selectCount,
} from "../../store";
import { useAsyncEffect } from "ahooks";
import { tdApp } from "../../utils";

const { Footer, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function processLocation(pathname: string) {
  let name = pathname;
  if (pathname === "/") {
    name = "/home";
  }
  return name.substring(1);
}

const App: FC = () => {
  const {
    getAppStore: ipcGetAppStore,
    openUrl,
    setAppStore: ipcSetAppStore,
    showBrowserWindow,
  } = useElectron();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showExport, setShowExport] = useState(false);
  const count = useSelector(selectCount);
  const appStore = useSelector(selectAppStore);

  const items: MenuItem[] = [
    {
      label: (
        <Link
          to="/"
          className="like-item"
          onClick={() => {
            dispatch(clearCount());
          }}
        >
          <DownloadOutlined />
          <span>下载列表</span>
          {count > 0 && (
            <Badge count={count} offset={[5, 1]} size="small"></Badge>
          )}
        </Link>
      ),
      key: "home",
    },
    {
      label: (
        <Link to="/done" className="like-item">
          <CheckCircleOutlined />
          <span>下载完成</span>
        </Link>
      ),
      key: "done",
    },
    {
      label: (
        <Link to="/source" className="like-item">
          <ProfileOutlined />
          <span>素材提取</span>
          {showExport && (
            <Button
              title="在新窗口中打开"
              type="text"
              style={{ marginLeft: "auto" }}
              icon={<ExportOutlined />}
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();

                dispatch(setAppStore({ openInNewWindow: true }));
                if (location.pathname === "/source") {
                  navigate("/");
                }
                // FIXME: 有可能 webview 还没有完全隐藏
                await ipcSetAppStore("openInNewWindow", true);
                await showBrowserWindow();
              }}
            />
          )}
        </Link>
      ),
      key: "source",
      onMouseEnter: () => {
        setShowExport(true);
      },
      onMouseLeave: () => {
        setShowExport(false);
      },
    },
    {
      label: (
        <Link to="/settings" className="like-item">
          <SettingOutlined />
          <span>设置</span>
        </Link>
      ),
      key: "settings",
    },
  ];

  const finalItems = items.filter((item) =>
    appStore.openInNewWindow ? item?.key !== "source" : true,
  );

  const openHelpUrl = () => {
    tdApp.openHelpPage();
    const url = "https://downloader.caorushizi.cn/guides.html?form=client";
    openUrl(url);
  };

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

  return (
    <Layout className="container">
      <Sider className="container-sider" theme="light">
        <Menu
          style={{ height: "100%" }}
          defaultSelectedKeys={[processLocation(location.pathname)]}
          mode="vertical"
          theme="light"
          items={finalItems}
        />
      </Sider>
      <Layout>
        <Content className="container-inner">
          <Outlet />
        </Content>
        <Footer className="container-footer">
          <Button
            type={"link"}
            onClick={openHelpUrl}
            icon={<QuestionCircleOutlined />}
          >
            使用帮助
          </Button>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;
