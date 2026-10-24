import React from "react";
import { createRoot } from "react-dom/client";
import i18n from "../../../apps/ui/src/i18n";
import "../../../apps/ui/src/globals.css";
import {
  AnalyticsConsentNotice,
  AnalyticsPreferences,
} from "../../../apps/ui/src/components/analytics-preferences";
import { analyticsConsent } from "../../../apps/ui/src/services/analytics-consent";
import { tdApp } from "../../../apps/ui/src/utils/tdapp";
import { TooltipProvider } from "../../../apps/ui/src/components/ui/tooltip";

await i18n.changeLanguage("en");
await analyticsConsent.initialize();
createRoot(document.getElementById("root")!).render(
  <TooltipProvider>
    <main className="mx-auto max-w-xl p-6">
      <h1>MediaGo statistics regression</h1>
      <AnalyticsPreferences />
      <button
        onClick={() =>
          tdApp.onEvent("DOWNLOAD_NOW", {
            deviceId: "must-not-leave",
            url: "https://private/",
          })
        }
      >
        Send test event
      </button>
      <AnalyticsConsentNotice />
    </main>
  </TooltipProvider>,
);
