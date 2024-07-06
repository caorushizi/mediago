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
    let content = <div></div>;
    if (store.status === BrowserStatus.Loading) {
      content = <Spin />;
    } else if (modalShow) {
      content = (
        <img
          src={placeHolder}
          alt=""
          style={{
            height: "100%",
            width: "100%",
          }}
        />
      );
    } else if (store.status === BrowserStatus.Failed) {
      content = (
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
    } else if (store.status === BrowserStatus.Loaded) {
      content = <WebView className="webview-inner" />;
    }
    return content;
  };
  return <div className="webview-container">{renderContent()}</div>;
}
