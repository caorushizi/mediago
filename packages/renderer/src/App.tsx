import { ConfigProvider, theme } from "antd";
import React, { FC, Suspense, lazy, useEffect } from "react";
import AppLayout from "./layout/App";
import { useDispatch } from "react-redux";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { DownloadFilter } from "./nodes/HomePage";
import { setAppStore, increase } from "./store";
import "dayjs/locale/zh-cn";
import zhCN from "antd/locale/zh_CN";
import "./App.scss";
import useElectron from "./hooks/electron";
import Loading from "./components/Loading";

const HomePage = lazy(() => import("./nodes/HomePage"));
const SourceExtract = lazy(() => import("./nodes/SourceExtract"));
const SettingPage = lazy(() => import("./nodes/SettingPage"));

const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "done",
        element: (
          <Suspense fallback={<Loading />}>
            <HomePage filter={DownloadFilter.done} />
          </Suspense>
        ),
      },
      {
        path: "source",
        element: (
          <Suspense fallback={<Loading />}>
            <SourceExtract />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<Loading />}>
            <SettingPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/browser",
    element: (
      <Suspense fallback={<Loading />}>
        <SourceExtract page={true} />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: <div>404</div>,
  },
]);

function getAlgorithm(appTheme: "dark" | "light") {
  return appTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm;
}

const App: FC = () => {
  const dispatch = useDispatch();
  const [appTheme, setAppTheme] = React.useState<"dark" | "light">("light");
  const { addIpcListener, removeIpcListener } = useElectron();

  const themeChange = (event: MediaQueryListEvent) => {
    if (event.matches) {
      setAppTheme("dark");
    } else {
      setAppTheme("light");
    }
  };

  // 监听store变化
  const onAppStoreChange = (event: any, store: AppStore) => {
    dispatch(setAppStore(store));
  };

  const onReceiveDownloadItem = () => {
    dispatch(increase());
  };

  useEffect(() => {
    addIpcListener("store-change", onAppStoreChange);
    addIpcListener("download-item-notifier", onReceiveDownloadItem);

    return () => {
      removeIpcListener("store-change", onAppStoreChange);
      removeIpcListener("download-item-notifier", onReceiveDownloadItem);
    };
  }, []);

  useEffect(() => {
    const isDarkTheme = matchMedia("(prefers-color-scheme: dark)");
    isDarkTheme.addEventListener("change", themeChange);

    if (isDarkTheme.matches) {
      setAppTheme("dark");
    } else {
      setAppTheme("light");
    }

    return () => {
      isDarkTheme.removeEventListener("change", themeChange);
    };
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      componentSize="small"
      theme={{ algorithm: getAlgorithm(appTheme) }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
};

export default App;
