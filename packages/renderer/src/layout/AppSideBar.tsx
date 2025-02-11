import React, {
  cloneElement,
  PropsWithChildren,
  ReactElement,
  useMemo,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "antd";
import useElectron from "@/hooks/useElectron";
import { useTranslation } from "react-i18next";
import { cn, isWeb } from "@/utils";
import {
  ConverterIcon,
  DoneIcon,
  ExtractIcon,
  ListIcon,
  SettingsIcon,
  ShareIcon,
} from "@/assets/svg";
import siderBg from "@/assets/images/sider-bg.png";
import { updateSelector, useSessionStore } from "@/store/session";
import { useShallow } from "zustand/react/shallow";
import {
  useAppStore,
  appStoreSelector,
  setAppStoreSelector,
} from "@/store/app";
import { downloadStoreSelector, useDownloadStore } from "@/store/download";
import { useMemoizedFn } from "ahooks";

function processLocation(pathname: string) {
  let name = pathname;
  if (pathname === "/") {
    name = "/home";
  }
  return name.substring(1);
}

type MenuItem = {
  label: ReactElement;
  key: string;
};

interface AppMenuItemProps extends PropsWithChildren {
  onClick?: () => void;
  link: string;
  activeKey: string;
  className?: string;
  icon?: ReactElement;
}

function AppMenuItem({
  children,
  onClick,
  link,
  activeKey,
  className,
  icon,
}: AppMenuItemProps) {
  const isActive = useMemo(() => {
    return activeKey === processLocation(link);
  }, [activeKey, link]);

  return (
    <Link
      to={link}
      className={cn(
        "flex h-10 flex-row items-center gap-3 rounded-lg bg-[#FAFCFF] px-3 text-sm text-[#636D7E] hover:bg-[#E1F0FF] hover:text-[#636D7E] dark:bg-[#2C2E33] dark:text-[rgba(255,255,255,0.85)] dark:hover:bg-[#3B3C41] dark:hover:text-[rgba(255,255,255,0.85)]",
        {
          "bg-gradient-to-r from-[#127AF3] to-[#06D5FB] text-white hover:text-white dark:text-white":
            isActive,
        },
        className,
      )}
      onClick={onClick}
    >
      {icon &&
        cloneElement(icon as React.ReactElement, {
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
  const { count, clearCount } = useDownloadStore(
    useShallow(downloadStoreSelector),
  );
  const appStore = useAppStore(useShallow(appStoreSelector));
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const { updateAvailable } = useSessionStore(useShallow(updateSelector));

  const activeKey = useMemo(
    () => processLocation(location.pathname),
    [location.pathname],
  );

  const handleExternalLink = useMemoizedFn(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();

      setAppStore({ openInNewWindow: true });
      if (location.pathname === "/source") {
        navigate("/");
      }
      // FIXME: It is possible that the webview is not completely hidden yet
      await ipcSetAppStore("openInNewWindow", true);
      await showBrowserWindow();
    },
  );

  const handleClearCount = useMemoizedFn(() => {
    clearCount();
  });

  const items1: MenuItem[] = useMemo(() => {
    return [
      {
        label: (
          <AppMenuItem
            link="/"
            onClick={handleClearCount}
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
            <span className="flex flex-1">{t("materialExtraction")}</span>
            <div
              title={t("openInNewWindow")}
              className="hidden hover:opacity-70 group-hover:block"
              onClick={handleExternalLink}
            >
              <ShareIcon
                fill={"/source" === location.pathname ? "#fff" : "#AAB5CB"}
              />
            </div>
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
            <Badge dot={updateAvailable} offset={[-13, -3]} />
          </AppMenuItem>
        ),
        key: "settings",
      },
    ];
  }, [
    activeKey,
    count,
    handleExternalLink,
    location.pathname,
    t,
    updateAvailable,
    handleClearCount,
  ]);

  const finalItems = useMemo(() => {
    return items1
      .filter((i) =>
        isWeb ? i.key !== "source" && i.key !== "converter" : true,
      )
      .filter((item) =>
        appStore.openInNewWindow ? item?.key !== "source" : true,
      );
  }, [items1, appStore.openInNewWindow]);

  return (
    <div
      className={cn(
        "relative select-none bg-[#fff] p-3 dark:bg-[#1F2024]",
        className,
      )}
    >
      <div className="relative z-10 flex w-[180px] flex-col gap-3">
        {finalItems.map((item) => cloneElement(item.label, { key: item.key }))}
      </div>

      <img
        src={siderBg}
        className="pointer-events-none absolute bottom-0 left-0 right-0 select-none"
      />
    </div>
  );
}
