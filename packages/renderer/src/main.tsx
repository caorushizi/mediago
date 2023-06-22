import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css";
import React, { FC, StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import HomePage from "./nodes/HomePage";
import SettingPage from "./nodes/SettingPage";
import PlayerPage from "./nodes/PlayerPage";
import SourceExtract from "./nodes/SourceExtract";
import store from "./store";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import zhCN from "antd/locale/zh_CN";
import "./index.scss";
import { tdApp } from "./utils";

dayjs.locale("zh-cn");
tdApp.init();

function getAlgorithm(appTheme: "dark" | "light") {
  return appTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm;
}

const Root: FC = () => {
  const [appTheme, setAppTheme] = React.useState<"dark" | "light">("light");

  const themeChange = (event: MediaQueryListEvent) => {
    if (event.matches) {
      setAppTheme("dark");
    } else {
      setAppTheme("light");
    }
  };

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="source-extract" element={<SourceExtract />} />
            <Route path="settings" element={<SettingPage />} />
            <Route path="*" element={<div>404</div>} />
          </Route>
          <Route path="/browser" element={<SourceExtract page={true} />} />
          <Route path="/player" element={<PlayerPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <Root />
    </Provider>
  </StrictMode>
);
