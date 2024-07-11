import WebView from "@/components/WebView";
import useElectron from "@/hooks/electron";
import {
  BrowserStatus,
  PageMode,
  selectBrowserStore,
  setBrowserStore,
} from "@/store";
import { generateUrl } from "@/utils";
import { Button, Empty, Space, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

interface Props {
  onDownloadForm: (data: DownloadItem) => void;
}

export function BrowserView({ onDownloadForm }: Props) {
  const { webviewLoadURL, addIpcListener, removeIpcListener, webviewGoHome } =
    useElectron();
  const store = useSelector(selectBrowserStore);
  const { t } = useTranslation();
  const [modalShow, setModalShow] = useState(false);
  const [placeHolder, setPlaceHolder] = useState<string>("");
  const dispatch = useDispatch();

  useEffect(() => {
    const onShowDownloadDialog = async (
      e: unknown,
      data: DownloadItem[],
      image: string,
    ) => {
      // FIXME: 选择
      onDownloadForm(data[data.length - 1]);

      setPlaceHolder(image);
      setModalShow(true);
    };

    addIpcListener("show-download-dialog", onShowDownloadDialog);

    return () => {
      removeIpcListener("show-download-dialog", onShowDownloadDialog);
    };
  }, [store.status]);

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

  const goto = () => {
    const link = generateUrl(store.url);
    loadUrl(link);
  };

  const renderContent = () => {
    // 加载状态
    if (store.status === BrowserStatus.Loading) {
      return <Spin />;
    }

    // 模态框
    if (modalShow) {
      return <img src={placeHolder} className="h-full w-full" />;
    }

    // 加载失败
    if (store.status === BrowserStatus.Failed) {
      return (
        <Empty
          description={`${store.errMsg || t("loadFailed")} (${store.errCode})`}
        >
          <Space>
            <Button type="primary" onClick={onClickGoHome}>
              {t("backToHome")}
            </Button>
            <Button onClick={goto}>{t("refresh")}</Button>
          </Space>
        </Empty>
      );
    }

    // 加载成功
    if (store.status === BrowserStatus.Loaded) {
      return <WebView className="h-full w-full flex-1" />;
    }

    return null;
  };
  return <div className="flex flex-1">{renderContent()}</div>;
}
