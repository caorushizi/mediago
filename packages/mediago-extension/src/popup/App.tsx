import { DownloadCloud, Settings, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { renderLocalized } from "@/i18n/localized-message";

import { EmptyState } from "./components/EmptyState";
import { SourceItem } from "./components/SourceItem";
import { StatusBadge } from "./components/StatusBadge";
import { usePopupData } from "./use-popup-data";

export function App() {
  const { t } = useTranslation();
  const data = usePopupData((kind, value) => {
    const text = renderLocalized(t, value, "popup.importFailed");
    if (kind === "success") toast.success(text);
    else toast.error(text);
  });

  const { sources, tab, settings, serverStatus, importing } = data;
  const hasSources = sources.length > 0;

  return (
    // max-h-[inherit] picks up the body.popup cap from globals.css, so
    // the wrapper is as tall as its content up to that ceiling. When
    // the source list overflows, `<main>`'s `flex-1 min-h-0
    // overflow-y-auto` takes the remaining space and scrolls.
    <div className="flex max-h-[inherit] flex-col bg-background text-foreground">
      {/* header — warm cream, no divider; tonal shift against the
          source list below is enough separation */}
      <header className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2">
          <img
            src="/public/icons/mediago-32.png"
            alt=""
            width={20}
            height={20}
          />
          <span className="text-[15px] font-medium tracking-[-0.011em]">
            {t("popup.header")}
          </span>
        </div>
        <StatusBadge status={serverStatus} settings={settings} />
      </header>

      {/* page info — serif title, mono URL. The typographic voice shift
          makes the "what is this page" block read as editorial, while
          the URL is machine-readable */}
      {(tab?.title || tab?.url) && (
        <section className="border-t border-border bg-surface-100 px-4 py-2.5">
          <div className="truncate font-serif text-[13px] font-medium leading-tight">
            {tab?.title ?? ""}
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
            {tab?.url ?? ""}
          </div>
        </section>
      )}

      {/* sources — `min-h-0` lets this flex child shrink below its
          content size, which is what enables internal scrolling when
          the wrapper hits max-h */}
      <main className="min-h-0 flex-1 overflow-y-auto border-t border-border bg-background px-3 py-3">
        {!hasSources ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-2">
            {sources.map((s) => (
              <SourceItem
                key={s.id}
                source={s}
                disabled={importing}
                onImport={data.importOne}
              />
            ))}
          </ul>
        )}
      </main>

      {/* action bar — warm primary as the dominant CTA */}
      <footer className="flex items-center gap-2 border-t border-border bg-surface-100 px-3 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasSources}
          onClick={data.clear}
          title={t("popup.clear")}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">{t("popup.clear")}</span>
        </Button>
        <Button
          className="flex-1"
          size="sm"
          variant="dark"
          disabled={!hasSources || importing}
          onClick={data.importAll}
        >
          <DownloadCloud className="h-3.5 w-3.5" />
          {hasSources
            ? t("popup.importAllWithCount", { count: sources.length })
            : t("popup.importAll")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title={t("popup.settings")}
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
