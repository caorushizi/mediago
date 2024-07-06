import React, { FC, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button, Layout, Menu, MenuProps, Flex, Typography } from "antd";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ExportOutlined,
  EyeInvisibleOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  SyncOutlined,
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
import { useTranslation } from "react-i18next";
import { useStyles } from "./style";
import { cn } from "@/utils";

const { Footer, Sider, Content } = Layout;
const { Text } = Typography;

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
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const count = useSelector(selectCount);
  const appStore = useSelector(selectAppStore);
  const { styles } = useStyles();

  const items: MenuItem[] = [
    {
      label: (
        <Link
          to="/"
          className={styles.linkItem}
          onClick={() => {
            dispatch(clearCount());
          }}
        >
          <DownloadOutlined />
          <span>{t("downloadList")}</span>
          {count > 0 && (
            <Badge count={count} offset={[5, 1]} size="small"></Badge>
          )}
        </Link>
      ),
      key: "home",
    },
    {
      label: (
        <Link to="/done" className={styles.linkItem}>
          <CheckCircleOutlined />
          <span>{t("downloadComplete")}</span>
        </Link>
      ),
      key: "done",
    },
    {
      label: (
        <Link to="/converter" className={styles.linkItem}>
          <SyncOutlined />
          <span>{t("converter")}</span>
        </Link>
      ),
      key: "converter",
    },
    {
      label: (
        <Link to="/source" className={cn([styles.linkItem, styles.extract])}>
          <ProfileOutlined />
          <span>{t("materialExtraction")}</span>
          <Button
            title={t("openInNewWindow")}
            type="text"
            className={styles.hoverButton}
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
        </Link>
      ),
      key: "source",
    },
    {
      label: (
        <Link to="/settings" className={styles.linkItem}>
          <SettingOutlined />
          <span>{t("setting")}</span>
        </Link>
      ),
      key: "settings",
    },
  ];

  const finalItems = items.filter((item) =>
    appStore.openInNewWindow ? item?.key !== "source" : true
  );

  const openHelpUrl = () => {
    const url = "https://downloader.caorushizi.cn/guides.html?form=client";
    openUrl(url);
  };

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    dispatch(setAppStore(store));
  }, []);

  return (
    <Layout className={styles.container}>
      <Sider className={styles.containerSider} theme="light">
        <Flex
          vertical
          justify="space-between"
          className={styles.containerInner}
        >
          <Menu
            style={{ border: "none" }}
            defaultSelectedKeys={[processLocation(location.pathname)]}
            mode="vertical"
            theme="light"
            items={finalItems}
          />
        </Flex>
      </Sider>
      <Layout>
        <Content className="container-inner">
          <Outlet />
        </Content>
        <Footer className={styles.containerFooter}>
          <Text>
            {appStore.privacy && (
              <>
                <EyeInvisibleOutlined /> 隐私模式
              </>
            )}
          </Text>

          <Button
            type={"link"}
            onClick={openHelpUrl}
            icon={<QuestionCircleOutlined />}
          >
            {t("help")}
          </Button>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;
