import { DownloadCloud, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { EmptyState } from "./components/EmptyState";
import { SourceItem } from "./components/SourceItem";
import { StatusBadge } from "./components/StatusBadge";
import { usePopupData } from "./use-popup-data";

export function App() {
  const data = usePopupData((kind, text) => {
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
    <div className="flex max-h-[inherit] flex-col bg-background">
      {/* header */}
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-1.5 font-semibold">
          <img
            src="/public/icons/mediago-32.png"
            alt=""
            width={18}
            height={18}
          />
          <span className="text-sm">MediaGo 资源检测</span>
        </div>
        <StatusBadge status={serverStatus} settings={settings} />
      </header>
      <Separator />

      {/* page info */}
      <section className="space-y-0.5 px-3 py-2">
        <div className="truncate text-sm font-medium">{tab?.title ?? ""}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {tab?.url ?? ""}
        </div>
      </section>
      <Separator />

      {/* sources — `min-h-0` lets this flex child shrink below its
          content size, which is what enables internal scrolling when
          the wrapper hits max-h */}
      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
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

      <Separator />
      {/* action bar */}
      <footer className="flex items-center gap-2 px-3 py-2.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasSources}
          onClick={data.clear}
        >
          <Trash2 className="h-3.5 w-3.5" />
          清空
        </Button>
        <Button
          className="flex-1"
          size="sm"
          disabled={!hasSources || importing}
          onClick={data.importAll}
        >
          <DownloadCloud className="h-3.5 w-3.5" />
          {hasSources ? `导入全部（${sources.length}）` : "导入全部"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="设置"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
