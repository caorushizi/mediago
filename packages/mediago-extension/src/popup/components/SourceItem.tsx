import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DetectedSource } from "@/shared/types";

interface Props {
  source: DetectedSource;
  onImport: (source: DetectedSource) => void;
  disabled: boolean;
}

export function SourceItem({ source, onImport, disabled }: Props) {
  return (
    <li className="flex items-start gap-2 rounded-md border bg-card p-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[10px] uppercase"
          >
            {source.type}
          </Badge>
          <span className="truncate text-sm font-medium">
            {source.name || "(未命名)"}
          </span>
        </div>
        <div
          className="mt-1 line-clamp-2 break-all text-[11px] leading-relaxed text-muted-foreground"
          title={source.url}
        >
          {source.url}
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => onImport(source)}
      >
        <Download className="h-3 w-3" />
        导入
      </Button>
    </li>
  );
}
