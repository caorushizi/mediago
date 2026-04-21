import "@/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";

import { Toaster } from "@/components/ui/sonner";
import { bootstrapExtensionI18n } from "@/i18n/bootstrap";
import { applySystemTheme } from "@/lib/theme";
import { App } from "./App";

applySystemTheme();

void (async () => {
  const i18n = await bootstrapExtensionI18n();
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <App />
        <Toaster richColors position="top-center" duration={2400} />
      </I18nextProvider>
    </React.StrictMode>,
  );
})();
