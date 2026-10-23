import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { usePlatform } from "../hooks/use-platform";
import { analyticsConsent } from "../services/analytics-consent";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";

const SERVER_CONSENT = {
  enabled: false,
  decided: false,
  loaded: false,
  saving: false,
};

function useAnalyticsConsent() {
  return useSyncExternalStore(
    analyticsConsent.subscribe,
    analyticsConsent.getSnapshot,
    () => SERVER_CONSENT,
  );
}

function PrivacyPolicyButton() {
  const { t, i18n } = useTranslation();
  const { shell } = usePlatform();
  const language = i18n.resolvedLanguage?.split("-")[0];
  const prefix = language === "zh" ? "" : language === "it" ? "/it" : "/en";
  return (
    <Button
      type="button"
      variant="link"
      className="h-auto p-0"
      onClick={() => {
        void shell.open(
          `https://downloader.caorushizi.cn${prefix}/privacy.html`,
        );
      }}
    >
      {t("analyticsPrivacyPolicy")}
    </Button>
  );
}

async function choose(enabled: boolean, onError: () => void) {
  try {
    await analyticsConsent.choose(enabled);
  } catch {
    onError();
  }
}

export function AnalyticsPreferences() {
  const { t } = useTranslation();
  const state = useAnalyticsConsent();
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor="analytics-consent"
          className="cursor-pointer text-sm font-medium"
        >
          {t("analyticsUsage")}
        </label>
        <Switch
          id="analytics-consent"
          checked={state.enabled}
          disabled={!state.loaded || state.saving}
          onCheckedChange={(enabled) =>
            void choose(enabled, () => toast.error(t("analyticsSaveFailed")))
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("analyticsDescription")}
      </p>
      <PrivacyPolicyButton />
    </div>
  );
}

export function AnalyticsConsentNotice() {
  const { t } = useTranslation();
  const state = useAnalyticsConsent();
  if (!state.loaded || state.decided) return null;
  const save = (enabled: boolean) =>
    void choose(enabled, () => toast.error(t("analyticsSaveFailed")));
  return (
    <section
      aria-label={t("analyticsChoiceTitle")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl space-y-3 rounded-lg border bg-background p-4 shadow-lg"
    >
      <h2 className="text-sm font-semibold">{t("analyticsChoiceTitle")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("analyticsDescription")}
      </p>
      <PrivacyPolicyButton />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={state.saving}
          onClick={() => save(false)}
        >
          {t("analyticsDecline")}
        </Button>
        <Button
          type="button"
          disabled={state.saving}
          onClick={() => save(true)}
        >
          {t("analyticsAllow")}
        </Button>
      </div>
    </section>
  );
}
