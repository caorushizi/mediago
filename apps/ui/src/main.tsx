import "./utils/sentry";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { tdApp } from "./utils";
import "./i18n";
import "./globals.css";
import { BrowserRouter } from "react-router-dom";

tdApp.init();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
