import { ConfigProvider } from "antd";
import "antd/dist/reset.css";
import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={zhCN} componentSize="small">
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
    </Provider>
  </StrictMode>
);
