import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  if (status === null || settings === null) {
    return (
      <Badge variant="outline" className="gap-1.5 normal-case tracking-normal">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("status.detecting")}
      </Badge>
    );
  }

  if (settings.mode === "desktop-schema") {
    return (
      <Badge variant="edit" className="normal-case tracking-normal">
        {t("status.schemaMode")}
      </Badge>
    );
  }

  if (settings.mode === "docker-http" && !settings.serverUrl) {
    return (
      <Badge variant="warning" className="normal-case tracking-normal">
        {t("status.notConfigured")}
      </Badge>
    );
  }

  if (status.ok) {
    const host =
      settings.mode === "desktop-http"
        ? shortHost(DESKTOP_HTTP_BASE)
        : shortHost(settings.serverUrl);
    return (
      <Badge
        variant="success"
        className="font-mono normal-case tracking-normal"
      >
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
        {host}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="normal-case tracking-normal">
      {t("status.connectionFailed")}
    </Badge>
  );
}
