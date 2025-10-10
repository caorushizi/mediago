import { SHOW_DOWNLOAD_DIALOG } from "@mediago/shared-common";
import { useMemoizedFn } from "ahooks";
import { Empty, Space, Spin, Splitter } from "antd";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import DownloadForm, { type DownloadFormRef } from "@/components/download-form";
import { Button } from "@/components/ui/button";
import WebView from "@/components/web-view";
import useAPI from "@/hooks/use-api";
import { BrowserStatus, browserStoreSelector, PageMode, setBrowserSelector, useBrowserStore } from "@/store/browser";
import { generateUrl, randomName } from "@/utils";
import { BrowserViewPanel } from "./browser-view-panel";

export function BrowserView() {
  const { webviewLoadURL, addIpcListener, removeIpcListener, webviewGoHome } = useAPI();
  const downloadForm = useRef<DownloadFormRef>(null);
  const store = useBrowserStore(useShallow(browserStoreSelector));
  const { addSource, setBrowserStore } = useBrowserStore(useShallow(setBrowserSelector));
  const { t } = useTranslation();
  const [placeHolder, setPlaceHolder] = useState<string>("");
  const browserId = useId();

  useEffect(() => {
    const onShowDownloadDialog = async (e: unknown, data: DownloadItem[], image: string) => {
      if (image) {
        setPlaceHolder(image);
      }

      const item = data[0];
      downloadForm.current?.openModal({
        batch: false,
        type: item.type,
        url: item.url,
        name: item.name,
        headers: item.headers,
      });
    };

    const onWebviewLinkMessage = async (e: unknown, data: any) => {
      addSource({
        ...data,
        name: `${data.name}_${randomName()}`,
      });
    };

    addIpcListener(SHOW_DOWNLOAD_DIALOG, onShowDownloadDialog);
    addIpcListener("webview-link-message", onWebviewLinkMessage);

    return () => {
      removeIpcListener(SHOW_DOWNLOAD_DIALOG, onShowDownloadDialog);
      removeIpcListener("webview-link-message", onWebviewLinkMessage);
    };
  }, [store.status]);

  const onClickGoHome = useMemoizedFn(async () => {
    await webviewGoHome();
    setBrowserStore({
      url: "",
      title: "",
      mode: PageMode.Default,
    });
  });

  const loadUrl = useMemoizedFn((url: string) => {
    setBrowserStore({
      url,
      mode: PageMode.Browser,
      status: BrowserStatus.Loading,
    });
    webviewLoadURL(url);
  });

  const goto = useMemoizedFn(() => {
    const link = generateUrl(store.url);
    loadUrl(link);
  });

  const handleFormVisibleChange = useMemoizedFn((visible: boolean) => {
    if (!visible) {
      setPlaceHolder("");
    }
  });

  const renderContent = useMemoizedFn(() => {
    // Loaded state
    if (store.status === BrowserStatus.Loading) {
      return (
        <div className="flex h-full w-full flex-row items-center justify-center">
          <Spin />
        </div>
      );
    }

    // Modal box
    if (placeHolder) {
      return <img alt="" src={placeHolder} className="h-full w-full" />;
    }

    // Load failure
    if (store.status === BrowserStatus.Failed) {
      return (
        <div className="flex h-full w-full flex-row items-center justify-center">
          <Empty description={`${store.errMsg || t("loadFailed")} (${store.errCode})`}>
            <Space>
              <Button onClick={onClickGoHome}>{t("backToHome")}</Button>
              <Button onClick={goto}>{t("refresh")}</Button>
            </Space>
          </Empty>
        </div>
      );
    }

    // Load successfully
    if (store.status === BrowserStatus.Loaded) {
      return <WebView className="h-full w-full flex-1" />;
    }

    return null;
  });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {!store.sources.length ? (
        renderContent()
      ) : (
        <Splitter className="flex h-full flex-1 gap-2">
          <Splitter.Panel>{renderContent()}</Splitter.Panel>
          <Splitter.Panel min="20%" max="70%" defaultSize={240}>
            <BrowserViewPanel />
          </Splitter.Panel>
        </Splitter>
      )}
      <DownloadForm
        id={browserId}
        isEdit
        ref={downloadForm}
        destroyOnClose
        onFormVisibleChange={handleFormVisibleChange}
      />
    </div>
  );
}
