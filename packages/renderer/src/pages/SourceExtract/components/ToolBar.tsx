import useElectron from "@/hooks/electron";
import {
  BrowserStatus,
  PageMode,
  selectAppStore,
  selectBrowserStore,
  setAppStore,
  setBrowserStore,
} from "@/store";
import { cn, generateUrl, getFavIcon, tdApp } from "@/utils";
import { useRequest } from "ahooks";
import { Input, Tooltip } from "antd";
import React, { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  BackIcon,
  HomeIcon,
  PhoneIcon,
  FavFillIcon,
  RefreshIcon,
  SendIcon,
  ShareIcon,
  FavIcon,
  CloseIcon,
  PCIcon,
} from "@/assets/svg";
import { IconButton } from "@/components/IconButton";
import { ThemeContext } from "@/context/ThemeContext";
import { EyeInvisibleOutlined } from "@ant-design/icons";
import { OPEN_URL } from "@/const";

interface Props {
  page: boolean;
}

export function ToolBar({ page }: Props) {
  const {
    getFavorites,
    addFavorite,
    removeFavorite,
    webviewLoadURL,
    webviewGoBack,
    webviewGoHome,
    combineToHomePage,
    setUserAgent,
    webviewUrlContextMenu,
  } = useElectron();
  const theme = useContext(ThemeContext);
  const store = useSelector(selectBrowserStore);
  const appStore = useSelector(selectAppStore);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { data: favoriteList = [], refresh } = useRequest(getFavorites);

  const disabled =
    store.status !== BrowserStatus.Loaded || store.mode !== PageMode.Browser;

  // 设置默认UA
  const onSetDefaultUA = () => {
    const nextMode = !appStore.isMobile;
    setUserAgent(nextMode);
    dispatch(
      setAppStore({
        isMobile: nextMode,
      }),
    );
  };

  const curIsFavorite = useMemo(() => {
    return favoriteList.find((item) => item.url === store.url);
  }, [favoriteList, store.url]);

  const onInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!store.url) {
      return;
    }
    if (e.key !== "Enter") {
      return;
    }

    await goto();
  };

  const onClickGoBack = async () => {
    const back = await webviewGoBack();
    if (!back) {
      // TODO: 重置标题
      // document.title = originTitle.current;
      dispatch(setBrowserStore({ url: "", title: "", mode: PageMode.Default }));
    }
  };

  const onClickGoHome = async () => {
    await webviewGoHome();
    dispatch(
      setBrowserStore({
        url: "",
        title: "",
        mode: PageMode.Default,
      }),
    );
  };

  const loadUrl = (url: string) => {
    tdApp.onEvent(OPEN_URL);
    dispatch(
      setBrowserStore({
        url,
        mode: PageMode.Browser,
        status: BrowserStatus.Loading,
      }),
    );
    webviewLoadURL(url);
  };

  const onInputContextMenu = () => {
    webviewUrlContextMenu();
  };

  const onClickEnter = async () => {
    if (!store.url) {
      return;
    }

    await goto();
  };

  const onClickAddFavorite = async () => {
    if (curIsFavorite) {
      await removeFavorite(curIsFavorite.id);
    } else {
      const icon = await getFavIcon(store.url);
      await addFavorite({
        url: store.url,
        title: store.title || store.url,
        icon,
      });
    }
    refresh();
  };

  // 合并到主页
  const onCombineToHome = () => {
    combineToHomePage(store);
  };

  const goto = () => {
    const link = generateUrl(store.url);
    loadUrl(link);
  };

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
        onClick={onClickGoHome}
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
          onClick={onClickGoHome}
          icon={<CloseIcon fill={iconColor} />}
        />
      ) : (
        <IconButton
          disabled={disabled}
          title={t("refresh")}
          onClick={goto}
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
          dispatch(setBrowserStore({ url }));
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
