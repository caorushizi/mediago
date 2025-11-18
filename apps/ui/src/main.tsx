import "./utils/sentry";
import dayjs from "dayjs";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "dayjs/locale/zh-cn";
import App from "./App";
import { tdApp } from "./utils";
import "./i18n";
import "./globals.css";
import { BrowserRouter } from "react-router-dom";

dayjs.locale("zh-cn");
tdApp.init();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
