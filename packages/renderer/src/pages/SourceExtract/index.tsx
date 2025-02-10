import { useAsyncEffect, useMemoizedFn } from "ahooks";
import React, { useEffect, useRef } from "react";
import PageContainer from "@/components/PageContainer";
import useElectron from "@/hooks/useElectron";
import { FavoriteList } from "./components/FavoriteList";
import { BrowserView } from "./components/BrowserView";
import { ToolBar } from "./components/ToolBar";
import { cn } from "@/utils";
import { useAppStore, setAppStoreSelector } from "@/store/app";
import { useShallow } from "zustand/react/shallow";
import {
  BrowserStatus,
  browserStoreSelector,
  PageMode,
  setBrowserSelector,
  useBrowserStore,
} from "@/store/browser";

interface SourceExtractProps {
  page?: boolean;
}

const SourceExtract: React.FC<SourceExtractProps> = ({ page = false }) => {
  const {
    addIpcListener,
    removeIpcListener,
    getSharedState,
    getAppStore: ipcGetAppStore,
  } = useElectron();
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const store = useBrowserStore(useShallow(browserStoreSelector));
  const { setBrowserStore } = useBrowserStore(useShallow(setBrowserSelector));
  const originTitle = useRef(document.title);

  useAsyncEffect(async () => {
    const store = await ipcGetAppStore();
    setAppStore(store);
  }, []);

  useAsyncEffect(async () => {
    const state = await getSharedState();
    setBrowserStore(state);
  }, []);

  useEffect(() => {
    addIpcListener("webview-dom-ready", onDomReady);
    addIpcListener("webview-fail-load", onFailLoad);
    addIpcListener("webview-did-navigate", onDidNavigate);
    addIpcListener("webview-did-navigate-in-page", onDidNavigateInPage);

    return () => {
      removeIpcListener("webview-dom-ready", onDomReady);
      removeIpcListener("webview-fail-load", onFailLoad);
      removeIpcListener("webview-did-navigate", onDidNavigate);
      removeIpcListener("webview-did-navigate-in-page", onDidNavigateInPage);
    };
  }, [store.status]);

  const setPageInfo = useMemoizedFn(({ url, title }: UrlDetail) => {
    document.title = title;
    setBrowserStore({ url, title });
  });

  const onDomReady = useMemoizedFn((e: unknown, info: UrlDetail) => {
    setPageInfo(info);
  });

  const onFailLoad = useMemoizedFn(
    (e: unknown, data: { code: number; desc: string }) => {
      setBrowserStore({
        status: BrowserStatus.Failed,
        errCode: data.code,
        errMsg: data.desc,
      });
    },
  );

  const onDidNavigate = useMemoizedFn((e: unknown, info: UrlDetail) => {
    setPageInfo(info);
    setBrowserStore({ status: BrowserStatus.Loaded });
  });

  const onDidNavigateInPage = useMemoizedFn((e: unknown, info: UrlDetail) => {
    setPageInfo(info);
  });

  useEffect(() => {
    document.title = store.title || document.title;
    return () => {
      document.title = originTitle.current;
    };
  }, [store.title]);

  return (
    <PageContainer
      className={cn("flex flex-col p-0", { "gap-2": !page })}
      wrapperClassName={cn({ "p-0 bg-[#EBF0F5] dark:bg-[#141415]": page })}
    >
      <ToolBar page={page} />
      <div className="flex flex-1 overflow-hidden">
        {store.mode === PageMode.Browser ? <BrowserView /> : <FavoriteList />}
      </div>
    </PageContainer>
  );
};

export default SourceExtract;
