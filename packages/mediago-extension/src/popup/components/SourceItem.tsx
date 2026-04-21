import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge, variantForDownloadType } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DetectedSource } from "@/shared/types";

interface Props {
  source: DetectedSource;
  onImport: (source: DetectedSource) => void;
  disabled: boolean;
}

export function SourceItem({ source, onImport, disabled }: Props) {
  const { t } = useTranslation();
  return (
    <li className="group relative flex items-start gap-2.5 rounded-lg border border-border bg-surface-100 p-3 transition-colors hover:border-ring">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <Badge variant={variantForDownloadType(source.type)}>
            {source.type}
          </Badge>
          <span className="truncate text-[13px] font-medium tracking-tight">
            {source.name || t("source.unnamed")}
          </span>
        </div>
        <div
          className="line-clamp-2 break-all font-mono text-[11px] leading-snug text-muted-foreground"
          title={source.url}
        >
          {source.url}
        </div>
      </div>
      <Button
        size="xs"
        variant="outline"
        disabled={disabled}
        onClick={() => onImport(source)}
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
        {t("source.import")}
      </Button>
    </li>
  );
}
