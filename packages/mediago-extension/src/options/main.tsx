import "@/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { Toaster } from "@/components/ui/toast";
import { bootstrapExtensionI18n } from "@/i18n/bootstrap";
import { applySystemTheme } from "@/lib/theme";
import { App } from "./App";

applySystemTheme();

void (async () => {
  const i18n = await bootstrapExtensionI18n();
  const updateDocumentTitle = () => {
    document.title = i18n.t("options.pageTitle");
  };
  updateDocumentTitle();
  i18n.on("languageChanged", updateDocumentTitle);

  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Options root element not found");
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <Toaster>
          <App />
        </Toaster>
      </I18nextProvider>
    </React.StrictMode>,
  );
})();
