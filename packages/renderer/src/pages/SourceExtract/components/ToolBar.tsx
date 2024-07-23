import useElectron from "@/hooks/electron";
import {
  BrowserStatus,
  PageMode,
  selectAppStore,
  selectBrowserStore,
  setAppStore,
  setBrowserStore,
} from "@/store";
import { generateUrl, getFavIcon } from "@/utils";
import { CloseOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Input } from "antd";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  BackIcon,
  HomeIcon,
  PhoneIcon,
  FavIcon,
  RefreshIcon,
  SendIcon,
  ShareIcon,
} from "@/assets/svg";
import { IconButton } from "@/components/IconButton";

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

  return (
    <div className="flex flex-row items-center gap-1 rounded-lg bg-white px-3 py-2">
      <IconButton
        title={t("switchToMobileMode")}
        onClick={onSetDefaultUA}
        icon={appStore.isMobile ? <PhoneIcon /> : <PhoneIcon />}
      />
      <IconButton
        disabled={disabled}
        title={t("home")}
        onClick={onClickGoHome}
        icon={<HomeIcon />}
      />
      <IconButton
        disabled={disabled}
        title={t("back")}
        onClick={onClickGoBack}
        icon={<BackIcon />}
      />
      {store.mode === PageMode.Browser &&
      store.status === BrowserStatus.Loading ? (
        <IconButton
          title={t("cancle")}
          onClick={onClickGoHome}
          icon={<CloseOutlined />}
        />
      ) : (
        <IconButton
          disabled={disabled}
          title={t("refresh")}
          onClick={goto}
          icon={<RefreshIcon />}
        />
      )}
      <IconButton
        title={curIsFavorite ? t("cancelFavorite") : t("favorite")}
        onClick={onClickAddFavorite}
        disabled={disabled}
        icon={curIsFavorite ? <FavIcon /> : <FavIcon />}
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
      />
      <IconButton
        title={t("visit")}
        onClick={onClickEnter}
        disabled={!store.url}
        icon={<SendIcon />}
      />
      {page && (
        <IconButton
          title={t("mergeToMainWindow")}
          onClick={onCombineToHome}
          icon={<ShareIcon className="rotate-180" />}
        />
      )}
    </div>
  );
}
