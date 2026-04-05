import { useMemoizedFn } from "ahooks";
import { Empty, Space, Spin, Splitter } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import WebView from "@/components/web-view";
import { usePlatform } from "@/hooks/use-platform";
import {
  BrowserStatus,
  browserStoreSelector,
  PageMode,
  setBrowserSelector,
  useBrowserStore,
} from "@/store/browser";
import { generateUrl } from "@/utils";
import { BrowserViewPanel } from "./browser-view-panel";

export function BrowserView() {
  const { webviewLoadURL, addIpcListener, removeIpcListener, webviewGoHome } =
    usePlatform();
  const store = useBrowserStore(useShallow(browserStoreSelector));
  const { addSource, setBrowserStore } = useBrowserStore(
    useShallow(setBrowserSelector),
  );
  const { t } = useTranslation();

  useEffect(() => {
    const onWebviewLinkMessage = async (e: unknown, data: unknown) => {
      addSource(data);
    };

    addIpcListener("webview-link-message", onWebviewLinkMessage);

    return () => {
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

  const renderContent = useMemoizedFn(() => {
    // Loaded state
    if (store.status === BrowserStatus.Loading) {
      return (
        <div className="flex h-full w-full flex-row items-center justify-center">
          <Spin />
        </div>
      );
    }

    // Load failure
    if (store.status === BrowserStatus.Failed) {
      return (
        <div className="flex h-full w-full flex-row items-center justify-center">
          <Empty
            description={`${store.errMsg || t("loadFailed")} (${store.errCode})`}
          >
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
    </div>
  );
}
