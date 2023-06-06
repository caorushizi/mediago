import React, { FC, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Layout, Menu, MenuProps } from "antd";
import "./App.scss";
import {
  DownloadOutlined,
  ExportOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import useElectron from "./hooks/electron";
import { useDispatch, useSelector } from "react-redux";
import { selectStore, setAppStore } from "./store/appSlice";
import { useAsyncEffect } from "ahooks";
import { clearCount, selectCount } from "./store/downloadSlice";
import { tdApp } from "./utils";
import { restore, selectBrowserStore } from "./store/browserSlice";

const { Footer, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const App: FC = () => {
  const {
    getAppStore: ipcGetAppStore,
    openUrl,
    setAppStore: ipcSetAppStore,
    showBrowserWindow,
    rendererEvent,
    removeEventListener,
  } = useElectron();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showExport, setShowExport] = useState(false);
  const count = useSelector(selectCount);
  const appStore = useSelector(selectStore);
  const browserStore = useSelector(selectBrowserStore);

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
            <Badge size="small" count={count} offset={[5, -3]}></Badge>
          )}
        </Link>
      ),
      key: "home",
    },
    {
      label: (
        <Link to="/source-extract" className="like-item">
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
                if (location.pathname === "/source-extract") {
                  navigate("/");
                }
                // FIXME: 有可能 webview 还没有完全隐藏
                await ipcSetAppStore("openInNewWindow", true);
                await showBrowserWindow({ ...browserStore });
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

  // 监听store变化
  const onStoreChange = (event: any, store: AppStore) => {
    dispatch(setAppStore(store));
  };

  // 重新设置 store 数据
  const restoreStore = (e: any, store: BrowserStore) => {
    dispatch(restore(store));
  };

  useEffect(() => {
    rendererEvent("store-change", onStoreChange);
    rendererEvent("browser-window-restore", restoreStore);

    return () => {
      removeEventListener("store-change", onStoreChange);
      removeEventListener("browser-window-restore", restoreStore);
    };
  }, []);

  const finalItems = items.filter((item) =>
    appStore.openInNewWindow ? item?.key !== "source" : true
  );

  const openHelpUrl = () => {
    tdApp.openHelpPage();
    const url =
      "https://blog.ziying.site/post/media-downloader-how-to-use/?form=client";
    openUrl(url);
  };

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
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
            items={finalItems}
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
