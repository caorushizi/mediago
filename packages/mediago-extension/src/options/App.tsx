import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ImportBehaviourCard } from "./components/ImportBehaviourCard";
import { LanguageCard } from "./components/LanguageCard";
import { RuleListCard } from "./components/RuleListCard";
import { ServerCard } from "./components/ServerCard";

export function App() {
  const { t } = useTranslation();
  // Keep the browser tab title in sync with the UI language so the
  // options page reads "MediaGo 扩展设置" in Chinese and
  // "MediaGo Extension Settings" in English.
  useEffect(() => {
    document.title = t("options.pageTitle");
  }, [t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero band — surface-100, the lightest warm cream in the scale.
          The Cursor-style compressed display headline lives here with
          two corner blurs that echo the ambient/elevated shadow recipe
          without costing a box-shadow.

          Section tonal rhythm on this page: surface-100 (hero) →
          background (main content) → surface-200 (footer closer). This
          is the "warm section variation" the spec calls out — alternate
          cream tones instead of hard dividers. */}
      <header className="relative overflow-hidden border-b border-border bg-surface-100 pt-20 pb-16">
        <div className="absolute -top-32 -right-16 h-72 w-72 rounded-full bg-timeline-thinking/25 blur-3xl" />
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-timeline-read/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-2xl flex-col gap-5 px-6">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange" />
            MediaGo / Extension
          </div>
          <h1 className="max-w-xl text-hero font-medium font-feat-display">
            {t("options.pageTitle")}
          </h1>
          <p className="max-w-lg font-serif text-[17px] leading-relaxed font-feat-editorial text-muted-foreground">
            {t("options.server.description")}
          </p>
        </div>
      </header>

      {/* Settings stack — the long-form body. `gap-6` leaves enough
          warm space between cards that the tonal shifts (page → card)
          feel intentional. */}
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
        <ServerCard />
        <ImportBehaviourCard />
        <LanguageCard />
        <RuleListCard />
      </main>

      {/* Closing strip — surface-200 (= page background in the spec's
          scale) gives the composition a deliberate "outro" beat. The
          mono label keeps it from feeling like dead negative space. */}
      <footer className="border-t border-border bg-surface-200 py-10">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 px-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="inline-block h-1 w-1 rounded-full bg-success" />
          MediaGo · v{chrome.runtime.getManifest().version}
        </div>
      </footer>
    </div>
  );
}
