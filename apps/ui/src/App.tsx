import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import { type FC, lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import "dayjs/locale/zh-cn";
import { useAsyncEffect, useMemoizedFn } from "ahooks";
import zhCN from "antd/es/locale/zh_CN";
import enUS from "antd/es/locale/en_US";
import { useShallow } from "zustand/react/shallow";
import Loading from "./components/loading";
import { PAGE_LOAD } from "./const";
import {
  appStoreSelector,
  setAppStoreSelector,
  useAppStore,
} from "./store/app";
import { PageMode, setBrowserSelector, useBrowserStore } from "./store/browser";
import {
  themeSelector,
  updateSelector,
  useSessionStore,
} from "./store/session";
import { getBrowserLang, isWeb, tdApp } from "./utils";
import { usePlatform } from "./hooks/use-platform";
import { setupHttp } from "./utils/http";
import { getConfig } from "./api/config";
import { initGoEvents, onConfigChanged } from "./api/events";
import { AppLanguage, DownloadFilter } from "@mediago/shared-common";
import { useAuth } from "./hooks/use-auth";
import { Locale } from "antd/es/locale";

const AppLayout = lazy(() => import("./layout/app-layout"));
const HomePage = lazy(() => import("./pages/home-page"));
const SourceExtract = lazy(() => import("./pages/source-extract"));
const SettingPage = lazy(() => import("./pages/setting-page"));
const ConverterPage = lazy(() => import("./pages/converter-page"));
const SigninPage = lazy(() => import("./pages/signin-page"));

function getAlgorithm(appTheme: "dark" | "light") {
  return appTheme === "dark"
    ? antdTheme.darkAlgorithm
    : antdTheme.defaultAlgorithm;
}

const App: FC = () => {
  useAuth();
  const { addIpcListener, removeIpcListener } = usePlatform();
  const { setUpdateAvailable, setUploadChecking } = useSessionStore(
    useShallow(updateSelector),
  );
  const { setAppStore } = useAppStore(useShallow(setAppStoreSelector));
  const { language } = useAppStore(useShallow(appStoreSelector));
  const { setBrowserStore } = useBrowserStore(useShallow(setBrowserSelector));
  const { theme, setTheme } = useSessionStore(useShallow(themeSelector));
  const [appLocale, setAppLocale] = useState<Locale>();
  const [adapterReady, setAdapterReady] = useState(false);

  useEffect(() => {
    if (language === AppLanguage.ZH) {
      setAppLocale(zhCN);
    } else if (language === AppLanguage.EN) {
      setAppLocale(enUS);
    } else {
      const lang = getBrowserLang();
      if (lang.startsWith("zh")) {
        setAppLocale(zhCN);
      } else {
        setAppLocale(enUS);
      }
    }
  }, [language]);

  const themeChange = useMemoizedFn((event: MediaQueryListEvent) => {
    if (event.matches) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  });

  // 监听config变化
  const handleConfigChanged = useMemoizedFn(
    (_event: unknown, data: { key: string; value: unknown }) => {
      setAppStore({ [data.key]: data.value });
    },
  );

  const onChangePrivacy = useMemoizedFn(() => {
    setBrowserStore({ url: "", title: "", mode: PageMode.Default });
  });

  useEffect(() => {
    const onUpdateAvailable = () => {
      setUpdateAvailable(true);
      setUploadChecking(false);
    };
    const onUpdateNotAvailable = () => {
      setUpdateAvailable(false);
      setUploadChecking(false);
    };
    const checkingForUpdate = () => {
      setUploadChecking(true);
    };
    // Go SSE events
    const unsubConfig = onConfigChanged(handleConfigChanged);

    // Electron IPC events
    addIpcListener("change-privacy", onChangePrivacy);
    addIpcListener("updateAvailable", onUpdateAvailable);
    addIpcListener("updateNotAvailable", onUpdateNotAvailable);
    addIpcListener("checkingForUpdate", checkingForUpdate);

    return () => {
      unsubConfig();
      removeIpcListener("change-privacy", onChangePrivacy);
      removeIpcListener("updateAvailable", onUpdateAvailable);
      removeIpcListener("updateNotAvailable", onUpdateNotAvailable);
      removeIpcListener("checkingForUpdate", checkingForUpdate);
    };
  }, []);

  useAsyncEffect(async () => {
    if (!adapterReady) return;
    try {
      const config = await getConfig();
      const deviceId = (config as Record<string, unknown>)?.machineId || "";
      tdApp.onEvent(PAGE_LOAD, { deviceId });
    } catch {
      tdApp.onEvent(PAGE_LOAD, { deviceId: "" });
    }
  }, [adapterReady]);

  useAsyncEffect(async () => {
    try {
      let coreUrl = "";

      if (isWeb) {
        // Web mode: Go Core serves both API and static files, same origin
        coreUrl = import.meta.env.DEV
          ? "http://127.0.0.1:9900"
          : window.location.origin;
        setupHttp(coreUrl);
        initGoEvents(coreUrl);
      } else {
        // Electron mode: get coreUrl directly from preload IPC
        // FIXME: wait for Go Core to fully start
        await new Promise((r) => setTimeout(r, 1000));
        const ipcResult = await window.electron?.getEnvPath();
        const envPath = ipcResult?.code === 0 ? ipcResult.data : ipcResult;
        if (envPath?.coreUrl) {
          coreUrl = envPath.coreUrl;
          setupHttp(coreUrl);
          initGoEvents(coreUrl);
        }
      }

      // Sync config from Go Core (single source of truth) to Zustand
      if (coreUrl) {
        try {
          const config = await getConfig();
          if (config) {
            setAppStore(config as Record<string, unknown>);
          }
        } catch {
          // Go Core may not be fully ready yet
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Go adapter init failed:", err);
    } finally {
      setAdapterReady(true);
    }
  }, []);

  useEffect(() => {
    const isDarkTheme = matchMedia("(prefers-color-scheme: dark)");
    isDarkTheme.addEventListener("change", themeChange);

    if (isDarkTheme.matches) {
      setTheme("dark");
    } else {
      setTheme("light");
    }

    return () => {
      isDarkTheme.removeEventListener("change", themeChange);
    };
  }, []);

  if (!adapterReady) {
    return <Loading />;
  }

  return (
    <ConfigProvider
      locale={appLocale}
      componentSize={isWeb ? undefined : "small"}
      theme={{ algorithm: getAlgorithm(theme) }}
    >
      <AntdApp className="size-full overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <Suspense fallback={<Loading />}>
                <AppLayout />
              </Suspense>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<Loading />}>
                  <HomePage />
                </Suspense>
              }
            />
            <Route
              path="done"
              element={
                <Suspense fallback={<Loading />}>
                  <HomePage filter={DownloadFilter.done} />
                </Suspense>
              }
            />
            <Route
              path="source"
              element={
                <Suspense fallback={<Loading />}>
                  <SourceExtract />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<Loading />}>
                  <SettingPage />
                </Suspense>
              }
            />
            <Route
              path="converter"
              element={
                <Suspense fallback={<Loading />}>
                  <ConverterPage />
                </Suspense>
              }
            />

            <Route path="*" element={<div>404</div>} />
          </Route>
          <Route
            path="signin"
            element={
              <Suspense fallback={<Loading />}>
                <SigninPage />
              </Suspense>
            }
          />
          <Route
            path="/browser"
            element={
              <Suspense fallback={<Loading />}>
                <SourceExtract page={true} />
              </Suspense>
            }
          />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
