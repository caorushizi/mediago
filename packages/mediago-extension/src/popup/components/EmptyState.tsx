import { Radar } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-timeline-read/20" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-surface-300">
          <Radar className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <p className="font-serif text-[13px] leading-relaxed text-muted-foreground">
        {t("empty.title")}
        <br />
        <span className="text-foreground/45">{t("empty.hint")}</span>
      </p>
    </div>
  );
}
