import { useAsyncEffect, useMemoizedFn } from "ahooks";
import { type React, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import PageContainer from "@/components/page-container";
import { setAppStoreSelector, useAppStore } from "@/store/app";
import {
  BrowserStatus,
  browserStoreSelector,
  PageMode,
  setBrowserSelector,
  useBrowserStore,
} from "@/store/browser";
import { cn, convertPlainObject } from "@/utils";
import { BrowserView } from "./components/browser-view";
import { FavoriteList } from "./components/favorite-list";
import { ToolBar } from "./components/tool-bar";
import { usePlatform } from "@/hooks/use-platform";
import { getConfig } from "@/api/config";

interface SourceExtractProps {
  page?: boolean;
}

const SourceExtract: React.FC<SourceExtractProps> = ({ page = false }) => {
  const { on, off, app } = usePlatform();
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const store = useBrowserStore(useShallow(browserStoreSelector));
  const { setBrowserStore } = useBrowserStore(useShallow(setBrowserSelector));
  const originTitle = useRef(document.title);

  useEffect(() => {
    const unsubscribe = useBrowserStore.subscribe(
      (state) => state,
      (state) => {
        app.setSharedState(convertPlainObject(state));
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useAsyncEffect(async () => {
    try {
      const configData = await getConfig();
      setAppStore(configData as Record<string, unknown>);
    } catch {
      // ignore
    }
  }, []);

  useAsyncEffect(async () => {
    const state = await app.getSharedState();
    setBrowserStore(state as Record<string, unknown>);
  }, []);

  useEffect(() => {
    on("browser:domReady", onDomReady);
    on("webview-fail-load", onFailLoad);
    on("browser:didNavigate", onDidNavigate);
    on("browser:didNavigateInPage", onDidNavigateInPage);

    return () => {
      off("browser:domReady", onDomReady);
      off("webview-fail-load", onFailLoad);
      off("browser:didNavigate", onDidNavigate);
      off("browser:didNavigateInPage", onDidNavigateInPage);
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
