import React, { cloneElement } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge, Button } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import useElectron from "../hooks/electron";
import { useDispatch, useSelector } from "react-redux";
import { selectAppStore, setAppStore, clearCount, selectCount } from "../store";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils";
import ConverterIcon from "./assets/converter.svg?react";
import DoneIcon from "./assets/done.svg?react";
import ExtractIcon from "./assets/extract.svg?react";
import ListIcon from "./assets/list.svg?react";
import SettingsIcon from "./assets/settings.svg?react";

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
  icon?: React.ReactNode;
}

function AppMenuItem({
  children,
  onClick,
  link,
  activeKey,
  className,
  icon,
}: AppMenuItemProps) {
  const isActive = activeKey === processLocation(link);
  return (
    <Link
      to={link}
      className={cn(
        "flex h-10 flex-row items-center gap-3 rounded-lg bg-[#FAFCFF] px-3 text-sm text-[#636D7E] hover:bg-[rgba(0,0,0,0.06)]",
        {
          "bg-gradient-to-r from-[#127AF3] to-[#06D5FB] text-white": isActive,
        },
        className,
      )}
      onClick={onClick}
    >
      {icon &&
        React.cloneElement(icon as React.ReactElement, {
          fill: isActive ? "#fff" : "#AAB5CB",
        })}
      {children}
    </Link>
  );
}

interface Props {
  className?: string;
}

export function AppSideBar({ className }: Props) {
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
          icon={<ListIcon />}
        >
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
        <AppMenuItem link="/done" activeKey={activeKey} icon={<DoneIcon />}>
          <span>{t("downloadComplete")}</span>
        </AppMenuItem>
      ),
      key: "done",
    },
    {
      label: (
        <AppMenuItem
          link="/converter"
          activeKey={activeKey}
          icon={<ConverterIcon />}
        >
          <span>{t("converter")}</span>
        </AppMenuItem>
      ),
      key: "converter",
    },
    {
      label: (
        <AppMenuItem
          link="/source"
          activeKey={activeKey}
          className="group"
          icon={<ExtractIcon />}
        >
          <span>{t("materialExtraction")}</span>
          <Button
            title={t("openInNewWindow")}
            type="text"
            className="hidden justify-self-end text-[#AAB5CB] group-hover:block"
            icon={<ExportOutlined />}
            onClick={handleExternalLink}
          />
        </AppMenuItem>
      ),
      key: "source",
    },
    {
      label: (
        <AppMenuItem
          link="/settings"
          activeKey={activeKey}
          icon={<SettingsIcon />}
        >
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
    <div
      className={cn("flex w-[180px] flex-col gap-3 bg-[#fff] p-3", className)}
    >
      {finalItems.map((item) => cloneElement(item.label, { key: item.key }))}
    </div>
  );
}
