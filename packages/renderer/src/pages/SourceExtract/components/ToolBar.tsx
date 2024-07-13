import useElectron from "@/hooks/electron";
import {
  BrowserStatus,
  PageMode,
  selectAppStore,
  selectBrowserStore,
  setAppStore,
  setBrowserStore,
} from "@/store";
import { cn, generateUrl, getFavIcon } from "@/utils";
import { CloseOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Input } from "antd";
import React, { PropsWithChildren, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import BackIcon from "./svg/back.svg?react";
import HomeIcon from "./svg/home.svg?react";
import PhoneIcon from "./svg/phone.svg?react";
import FavIcon from "./svg/fav.svg?react";
import RefreshIcon from "./svg/refresh.svg?react";
import SendIcon from "./svg/send.svg?react";
import ShareIcon from "./svg/share.svg?react";

interface ToolBtnProps extends PropsWithChildren {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}

function ToolBtn({ children, disabled, title, onClick }: ToolBtnProps) {
  return (
    <div
      className={cn("h-5 w-5 rounded-sm hover:bg-[#E1F0FF]", {
        "cursor-not-allowed": disabled,
      })}
      title={title}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

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
    <div className="flex flex-row items-center gap-1.5 rounded-lg bg-white px-3 py-2">
      <ToolBtn title={t("switchToMobileMode")} onClick={onSetDefaultUA}>
        {appStore.isMobile ? (
          <PhoneIcon fill="#515151" />
        ) : (
          <PhoneIcon stroke="#515151" />
        )}
      </ToolBtn>
      <ToolBtn disabled={disabled} title={t("home")} onClick={onClickGoHome}>
        <HomeIcon />
      </ToolBtn>
      <ToolBtn disabled={disabled} title={t("back")} onClick={onClickGoBack}>
        <BackIcon />
      </ToolBtn>
      {store.mode === PageMode.Browser &&
      store.status === BrowserStatus.Loading ? (
        <ToolBtn title={t("cancle")} onClick={onClickGoHome}>
          <CloseOutlined />
        </ToolBtn>
      ) : (
        <ToolBtn disabled={disabled} title={t("refresh")} onClick={goto}>
          <RefreshIcon />
        </ToolBtn>
      )}
      <ToolBtn
        title={curIsFavorite ? t("cancelFavorite") : t("favorite")}
        onClick={onClickAddFavorite}
        disabled={disabled}
      >
        {curIsFavorite ? (
          <FavIcon fill="#515151" />
        ) : (
          <FavIcon fill="none" stroke="#515151" />
        )}
      </ToolBtn>
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
      <ToolBtn title={t("visit")} onClick={onClickEnter} disabled={!store.url}>
        <SendIcon />
      </ToolBtn>
      {page && (
        <ToolBtn title={t("mergeToMainWindow")} onClick={onCombineToHome}>
          <ShareIcon transform="rotate(180)" />
        </ToolBtn>
      )}
    </div>
  );
}
