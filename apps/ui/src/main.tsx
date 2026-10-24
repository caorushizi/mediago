import "./bootstrap-share-intent";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerPwaServiceWorker } from "./services/pwa";
import { isWeb } from "./utils";
import { analyticsConsent } from "./services/analytics-consent";
import "./i18n";
import "./globals.css";
import { BrowserRouter } from "react-router-dom";
import { syncAppLanguage } from "./i18n/app-language";
import { useAppStore } from "./store/app";
if (isWeb) registerPwaServiceWorker();

const application = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
const shouldUseStrictMode = isWeb || import.meta.env.PROD;

async function startApplication() {
  await analyticsConsent.initialize();
  // Resolve the persisted preference once before React renders. In Electron,
  // this asks the main process for the OS language, so stale browser language
  // detector caches cannot decide the visible interface language.
  try {
    await syncAppLanguage(useAppStore.getState().language);
  } catch {
    // Keep the language selected during i18n initialization rather than
    // blocking the entire UI if the startup synchronization ever fails.
  }

  createRoot(document.getElementById("root") as HTMLElement).render(
    shouldUseStrictMode ? <StrictMode>{application}</StrictMode> : application,
  );
}

void startApplication();
