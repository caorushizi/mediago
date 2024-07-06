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
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  HomeOutlined,
  ImportOutlined,
  MobileFilled,
  MobileOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, Input, Space } from "antd";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

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
    <Space.Compact className="action-bar" block>
      <Button
        type="text"
        title={t("switchToMobileMode")}
        onClick={onSetDefaultUA}
      >
        {appStore.isMobile ? <MobileFilled /> : <MobileOutlined />}
      </Button>
      <Button
        disabled={disabled}
        title={t("home")}
        type="text"
        onClick={onClickGoHome}
      >
        <HomeOutlined />
      </Button>
      <Button
        disabled={disabled}
        title={t("back")}
        type="text"
        onClick={onClickGoBack}
      >
        <ArrowLeftOutlined />
      </Button>
      {store.mode === PageMode.Browser &&
      store.status === BrowserStatus.Loading ? (
        <Button title={t("cancle")} type="text" onClick={onClickGoHome}>
          <CloseOutlined />
        </Button>
      ) : (
        <Button
          disabled={disabled}
          title={t("refresh")}
          type="text"
          onClick={goto}
        >
          <ReloadOutlined />
        </Button>
      )}
      <Button
        type="text"
        title={curIsFavorite ? t("cancelFavorite") : t("favorite")}
        onClick={onClickAddFavorite}
        disabled={disabled}
      >
        {curIsFavorite ? <StarFilled /> : <StarOutlined />}
      </Button>
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
      <Button
        title={t("visit")}
        type="text"
        onClick={onClickEnter}
        disabled={!store.url}
      >
        <ArrowRightOutlined />
      </Button>
      {page && (
        <Button
          type="text"
          title={t("mergeToMainWindow")}
          onClick={onCombineToHome}
        >
          <ImportOutlined />
        </Button>
      )}
    </Space.Compact>
  );
}
