import { AlertCircle, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "../components/ui/toast";

import { Button } from "../components/ui/button";
import { resolveLanguage } from "../i18n";
import { renderLocalized } from "../i18n/localized-message";
import type {
  ExtensionLanguage,
  ExtensionSettings,
  InvocationMode,
  LocalizedMessage,
  ServerStatus,
} from "../shared/types";
import { AboutCard } from "./components/AboutCard";
import { ImportBehaviourCard } from "./components/ImportBehaviourCard";
import { LanguageCard } from "./components/LanguageCard";
import { PageQuickActionCard } from "./components/PageQuickActionCard";
import { RuleListCard } from "./components/RuleListCard";
import { ServerCard } from "./components/ServerCard";
import type { ConnectionDraft } from "./settings-model";
import { useOptions } from "./use-options";

export function resolveExtensionVersion(
  manifest: Pick<chrome.runtime.Manifest, "version" | "version_name">,
): string {
  return manifest.version_name ?? manifest.version;
}

export interface OptionsViewProps {
  settings: ExtensionSettings | null;
  draft: ConnectionDraft;
  loading: boolean;
  loadError: LocalizedMessage | string | null;
  testing: boolean;
  savingConnection: boolean;
  savingPreference: boolean;
  lastStatus: ServerStatus | null;
  version: string;
  onRetry: () => void;
  onModeChange: (mode: InvocationMode) => void;
  onServerUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onTest: () => void;
  onSaveConnection: () => void;
  onDownloadNowChange: (checked: boolean) => void;
  onPageQuickActionEnabledChange: (checked: boolean) => void;
  onLanguageChange: (language: ExtensionLanguage) => void;
}

function OptionsHeader() {
  const { t } = useTranslation();
  return (
    <header
      data-options-header="brand"
      className="border-b border-action-active bg-action text-white shadow-ambient"
    >
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
            <img
              src="/public/icons/mediago-32.png"
              width="24"
              height="24"
              alt=""
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">MediaGo</p>
            <p className="truncate text-[11px] text-white">
              {t("options.workspaceLabel")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-black/35 px-2.5 py-1.5 text-[11px] font-medium text-white">
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          {t("options.settingsLabel")}
        </div>
      </div>
    </header>
  );
}

function OptionsLoading() {
  const { t } = useTranslation();
  return (
    <div
      data-options-state="loading"
      aria-busy="true"
      role="status"
      className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]"
    >
      <span className="sr-only">{t("options.loadingTitle")}</span>
      <div className="h-[520px] animate-pulse rounded-lg border border-border bg-card motion-reduce:animate-none" />
      <div className="space-y-5">
        {[180, 220, 130].map((height) => (
          <div
            key={height}
            style={{ height }}
            className="animate-pulse rounded-lg border border-border bg-card motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}

function OptionsLoadError({
  error,
  onRetry,
}: {
  error: LocalizedMessage | string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      data-options-state="load-error"
      role="alert"
      className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-10 text-center shadow-ambient"
    >
      <div className="grid size-11 place-items-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold">
        {t("options.loadErrorTitle")}
      </h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
        {t("options.loadErrorHint")}
      </p>
      <p className="mt-3 max-w-lg break-words rounded-md bg-surface-subtle px-3 py-2 font-mono text-[11px] text-foreground-secondary">
        {renderLocalized(t, error)}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-5"
        data-action="retry"
        onClick={onRetry}
      >
        <RefreshCw className="size-3.5" aria-hidden="true" />
        {t("options.retry")}
      </Button>
    </div>
  );
}

export function OptionsView({
  settings,
  draft,
  loading,
  loadError,
  testing,
  savingConnection,
  savingPreference,
  lastStatus,
  version,
  onRetry,
  onModeChange,
  onServerUrlChange,
  onApiKeyChange,
  onTest,
  onSaveConnection,
  onDownloadNowChange,
  onPageQuickActionEnabledChange,
  onLanguageChange,
}: OptionsViewProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OptionsHeader />
      <main className="mx-auto max-w-[1120px] px-5 py-7 sm:px-6 sm:py-8">
        <div className="mb-6 max-w-2xl">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-brand-foreground">
            MediaGo / Extension
          </p>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.025em] sm:text-[28px]">
            {t("options.pageTitle")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("options.description")}
          </p>
        </div>

        {loading ? <OptionsLoading /> : null}
        {!loading && loadError ? (
          <OptionsLoadError error={loadError} onRetry={onRetry} />
        ) : null}
        {!loading && !loadError && settings ? (
          <div
            data-options-grid="workspace"
            className="grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]"
          >
            <div className="min-w-0 space-y-5">
              <ServerCard
                draft={draft}
                testing={testing}
                saving={savingConnection}
                lastStatus={lastStatus}
                onModeChange={onModeChange}
                onServerUrlChange={onServerUrlChange}
                onApiKeyChange={onApiKeyChange}
                onTest={onTest}
                onSave={onSaveConnection}
              />
              <RuleListCard />
            </div>
            <aside
              aria-label={t("options.preferencesLabel")}
              className="min-w-0 space-y-5 md:sticky md:top-5"
            >
              <PageQuickActionCard
                enabled={settings.pageQuickActionEnabled}
                saving={savingPreference}
                onEnabledChange={onPageQuickActionEnabledChange}
              />
              <ImportBehaviourCard
                settings={settings}
                mode={draft.mode}
                saving={savingPreference}
                onDownloadNowChange={onDownloadNowChange}
              />
              <LanguageCard
                language={settings.language}
                saving={savingPreference}
                onLanguageChange={onLanguageChange}
              />
              <AboutCard version={version} />
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export function App() {
  const { t, i18n } = useTranslation();
  const options = useOptions();

  useEffect(() => {
    document.title = t("options.pageTitle");
  }, [t]);

  const handleSaveConnection = async () => {
    const result = await options.saveConnection();
    if (result.ok) toast.add({ title: t("common.saved"), type: "success" });
    else {
      toast.add({
        title: renderLocalized(t, result.error, "common.saveFailed"),
        type: "error",
      });
    }
  };

  const handleDownloadNowChange = async (checked: boolean) => {
    const ok = await options.changeDownloadNow(checked);
    if (ok) toast.add({ title: t("common.saved"), type: "success" });
    else toast.add({ title: t("common.saveFailed"), type: "error" });
  };

  const handleLanguageChange = async (language: ExtensionLanguage) => {
    const ok = await options.changeLanguage(language);
    if (!ok) {
      toast.add({ title: t("common.saveFailed"), type: "error" });
      return;
    }
    await i18n.changeLanguage(resolveLanguage(language));
    toast.add({ title: t("common.saved"), type: "success" });
  };

  const handlePageQuickActionEnabledChange = async (checked: boolean) => {
    const ok = await options.changePageQuickActionEnabled(checked);
    if (ok) toast.add({ title: t("common.saved"), type: "success" });
    else toast.add({ title: t("common.saveFailed"), type: "error" });
  };

  const version =
    typeof chrome === "undefined"
      ? "0.0.0"
      : resolveExtensionVersion(chrome.runtime.getManifest());

  return (
    <OptionsView
      settings={options.settings}
      draft={options.draft}
      loading={options.loading}
      loadError={options.loadError}
      testing={options.testing}
      savingConnection={options.savingConnection}
      savingPreference={options.savingPreference}
      lastStatus={options.lastStatus}
      version={version}
      onRetry={() => void options.refresh()}
      onModeChange={options.setMode}
      onServerUrlChange={options.setServerUrl}
      onApiKeyChange={options.setApiKey}
      onTest={() => void options.test()}
      onSaveConnection={() => void handleSaveConnection()}
      onDownloadNowChange={(checked) => void handleDownloadNowChange(checked)}
      onPageQuickActionEnabledChange={(checked) =>
        void handlePageQuickActionEnabledChange(checked)
      }
      onLanguageChange={(language) => void handleLanguageChange(language)}
    />
  );
}
