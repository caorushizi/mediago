import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DESKTOP_HTTP_BASE } from "@/shared/constants";
import type { ExtensionSettings, ServerStatus } from "@/shared/types";

function shortHost(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

interface Props {
  status: ServerStatus | null;
  settings: ExtensionSettings | null;
}

export function StatusBadge({ status, settings }: Props) {
  if (status === null || settings === null) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        检测中
      </Badge>
    );
  }

  if (settings.mode === "desktop-schema") {
    return <Badge variant="secondary">Schema 模式</Badge>;
  }

  if (settings.mode === "docker-http" && !settings.serverUrl) {
    return <Badge variant="warning">未配置</Badge>;
  }

  if (status.ok) {
    const host =
      settings.mode === "desktop-http"
        ? shortHost(DESKTOP_HTTP_BASE)
        : shortHost(settings.serverUrl);
    return <Badge variant="success">{host}</Badge>;
  }

  return <Badge variant="destructive">连接失败</Badge>;
}
