import React, { cloneElement } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button } from "antd";
import {
  CheckCircleOutlined,
  DownloadOutlined,
  ExportOutlined,
  ProfileOutlined,
  SettingOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import useElectron from "../hooks/electron";
import { useDispatch, useSelector } from "react-redux";
import { selectAppStore, setAppStore, clearCount, selectCount } from "../store";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils";

function processLocation(pathname: string) {
  let name = pathname;
  if (pathname === "/") {
    name = "/home";
  }
  return name.substring(1);
}

type MenuItem = {
  label: React.ReactElement;
  key: string;
};

interface AppMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  link: string;
  activeKey: string;
  className?: string;
}

function AppMenuItem({
  children,
  onClick,
  link,
  activeKey,
  className,
}: AppMenuItemProps) {
  return (
    <Link
      to={link}
      className={cn(
        "flex h-10 flex-row items-center gap-3 rounded-lg bg-[#FAFCFF] px-3 text-[#666] hover:bg-[rgba(0,0,0,0.06)]",
        {
          "bg-gradient-to-r from-[#127AF3] to-[#00FCFF] text-white":
            activeKey === processLocation(link),
        },
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function AppSideBar() {
  const { setAppStore: ipcSetAppStore, showBrowserWindow } = useElectron();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const count = useSelector(selectCount);
  const appStore = useSelector(selectAppStore);

  const activeKey = processLocation(location.pathname);

  const handleExternalLink = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();

    dispatch(setAppStore({ openInNewWindow: true }));
    if (location.pathname === "/source") {
      navigate("/");
    }
    // FIXME: 有可能 webview 还没有完全隐藏
    await ipcSetAppStore("openInNewWindow", true);
    await showBrowserWindow();
  };

  const items: MenuItem[] = [
    {
      label: (
        <AppMenuItem
          link="/"
          onClick={() => {
            dispatch(clearCount());
          }}
          activeKey={activeKey}
        >
          <DownloadOutlined />
          <span>{t("downloadList")}</span>
          {count > 0 && (
            <Badge count={count} offset={[5, 1]} size="small"></Badge>
          )}
        </AppMenuItem>
      ),
      key: "home",
    },
    {
      label: (
        <AppMenuItem link="/done" activeKey={activeKey}>
          <CheckCircleOutlined />
          <span>{t("downloadComplete")}</span>
        </AppMenuItem>
      ),
      key: "done",
    },
    {
      label: (
        <AppMenuItem link="/converter" activeKey={activeKey}>
          <SyncOutlined />
          <span>{t("converter")}</span>
        </AppMenuItem>
      ),
      key: "converter",
    },
    {
      label: (
        <AppMenuItem link="/source" activeKey={activeKey} className="group">
          <ProfileOutlined />
          <span>{t("materialExtraction")}</span>
          <Button
            title={t("openInNewWindow")}
            type="text"
            className="hidden justify-self-end group-hover:block"
            icon={<ExportOutlined />}
            onClick={handleExternalLink}
          />
        </AppMenuItem>
      ),
      key: "source",
    },
    {
      label: (
        <AppMenuItem link="/settings" activeKey={activeKey}>
          <SettingOutlined />
          <span>{t("setting")}</span>
        </AppMenuItem>
      ),
      key: "settings",
    },
  ];

  const finalItems = items.filter((item) =>
    appStore.openInNewWindow ? item?.key !== "source" : true,
  );

  return (
    <div className="flex w-[200px] flex-col gap-3 p-3">
      {finalItems.map((item) => cloneElement(item.label, { key: item.key }))}
    </div>
  );
}
