import { EyeInvisibleOutlined } from "@ant-design/icons";
import { useMemoizedFn } from "ahooks";
import { Input, Tooltip } from "antd";
import { type KeyboardEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import {
  BackIcon,
  CloseIcon,
  FavFillIcon,
  FavIcon,
  HomeIcon,
  PCIcon,
  PhoneIcon,
  RefreshIcon,
  SendIcon,
  ShareIcon,
} from "@/assets/svg";
import { IconButton } from "@/components/icon-button";
import {
  appStoreSelector,
  setAppStoreSelector,
  useAppStore,
} from "@/store/app";
import {
  BrowserStatus,
  browserNavSelector,
  PageMode,
  setBrowserSelector,
  useBrowserStore,
} from "@/store/browser";
import { themeSelector, useSessionStore } from "@/store/session";
import { cn, getFavIcon } from "@/utils";
import { useBrowserActions } from "@/hooks/use-browser-actions";
import { useFavorites } from "@/hooks/use-favorites";
import { usePlatform } from "@/hooks/use-platform";

interface Props {
  page: boolean;
}

export function ToolBar({ page }: Props) {
  const { data: favoriteList, addFavorite, removeFavorite } = useFavorites();
  const { browser, app, contextMenu } = usePlatform();
  const { goto, goHome } = useBrowserActions();
  const { theme } = useSessionStore(useShallow(themeSelector));
  const store = useBrowserStore(useShallow(browserNavSelector));
  const { setBrowserStore } = useBrowserStore(useShallow(setBrowserSelector));
  const appStore = useAppStore(useShallow(appStoreSelector));
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const { t } = useTranslation();

  const disabled =
    store.status !== BrowserStatus.Loaded || store.mode !== PageMode.Browser;

  // Set default UA
  const onSetDefaultUA = useMemoizedFn(() => {
    const nextMode = !appStore.isMobile;
    browser.setUserAgent(nextMode);
    setAppStore({
      isMobile: nextMode,
    });
  });

  const curIsFavorite = useMemo(() => {
    return favoriteList.find((item) => item.url === store.url);
  }, [favoriteList, store.url]);

  const onInputKeyDown = useMemoizedFn(
    async (e: KeyboardEvent<HTMLInputElement>) => {
      if (!store.url || e.key !== "Enter") return;
      goto(store.url);
    },
  );

  const onClickGoBack = useMemoizedFn(async () => {
    const back = await browser.back();
    if (!back) {
      setBrowserStore({ url: "", title: "", mode: PageMode.Default });
    }
  });

  const onInputContextMenu = useMemoizedFn(() => {
    contextMenu.show([
      { key: "copy", label: t("copy") },
      { key: "paste", label: t("paste") },
    ]);
  });

  const onClickEnter = useMemoizedFn(() => {
    if (!store.url) return;
    goto(store.url);
  });

  const onClickAddFavorite = useMemoizedFn(async () => {
    if (curIsFavorite) {
      await removeFavorite(curIsFavorite.id);
    } else {
      const icon = getFavIcon(store.url);
      await addFavorite({
        url: store.url,
        title: store.title || store.url,
        icon,
      });
    }
  });

  const onCombineToHome = useMemoizedFn(() => {
    app.combineToHomePage({
      url: store.url,
      sourceList: [],
    });
  });

  const iconColor = theme === "dark" ? "white" : "black";

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2 bg-white px-3 py-2 dark:bg-[#1F2024]",
        {
          "rounded-lg": !page,
        },
      )}
    >
      <IconButton
        title={t("switchToMobileMode")}
        onClick={onSetDefaultUA}
        icon={
          appStore.isMobile ? (
            <PhoneIcon fill={iconColor} />
          ) : (
            <PCIcon fill={iconColor} />
          )
        }
      />
      <IconButton
        disabled={disabled}
        title={t("home")}
        onClick={goHome}
        icon={<HomeIcon fill={iconColor} />}
      />
      <IconButton
        disabled={store.mode === PageMode.Default}
        title={t("back")}
        onClick={onClickGoBack}
        icon={<BackIcon fill={iconColor} />}
      />
      {store.mode === PageMode.Browser &&
      store.status === BrowserStatus.Loading ? (
        <IconButton
          title={t("cancle")}
          onClick={goHome}
          icon={<CloseIcon fill={iconColor} />}
        />
      ) : (
        <IconButton
          disabled={disabled}
          title={t("refresh")}
          onClick={() => goto(store.url)}
          icon={<RefreshIcon fill={iconColor} />}
        />
      )}
      <IconButton
        title={curIsFavorite ? t("cancelFavorite") : t("favorite")}
        onClick={onClickAddFavorite}
        disabled={disabled}
        icon={
          curIsFavorite ? (
            <FavFillIcon fill={iconColor} />
          ) : (
            <FavIcon
              fill={iconColor}
              stroke={theme === "dark" ? "#B4B4B4" : "#020817"}
            />
          )
        }
      />
      <Input
        key="url-input"
        value={store.url}
        onChange={(e) => {
          const url = e.target.value;
          setBrowserStore({ url });
        }}
        onFocus={(e) => {
          e.target.select();
        }}
        onKeyDown={onInputKeyDown}
        onContextMenu={onInputContextMenu}
        placeholder={t("pleaseEnterUrl")}
        prefix={
          appStore.privacy ? (
            <Tooltip placement="top" title={t("privacy")}>
              <EyeInvisibleOutlined />
            </Tooltip>
          ) : undefined
        }
      />
      <IconButton
        title={t("visit")}
        onClick={onClickEnter}
        disabled={!store.url}
        icon={<SendIcon fill={iconColor} />}
      />
      {page && (
        <IconButton
          title={t("mergeToMainWindow")}
          onClick={onCombineToHome}
          icon={<ShareIcon className="rotate-180" fill={iconColor} />}
        />
      )}
    </div>
  );
}
