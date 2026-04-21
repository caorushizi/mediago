import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ExtensionSettings } from "@/shared/types";

import { useImportBehaviour } from "../use-import-behaviour";

export function ImportBehaviourCard() {
  const { t } = useTranslation();
  const { settings, patch } = useImportBehaviour();
  const disabled = settings === null;
  const downloadNow = settings?.downloadNow ?? false;
  const schemaSilent = settings?.schemaSilent ?? true;
  const schemaOnly = settings?.mode === "desktop-schema";

  const apply = async (update: Partial<ExtensionSettings>) => {
    const ok = await patch(update);
    if (ok) toast.success(t("common.saved"));
    else toast.error(t("common.saveFailed"));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="inline-block h-1 w-1 rounded-full bg-timeline-edit" />
          behaviour
        </div>
        <CardTitle>{t("options.importBehaviour.title")}</CardTitle>
        <CardDescription>
          {t("options.importBehaviour.descriptionLead")}
          <code className="mx-0.5 rounded-xs bg-surface-300 px-1 py-0.5 font-mono text-[11px] text-foreground">
            silent
          </code>
          {" / "}
          <code className="mx-0.5 rounded-xs bg-surface-300 px-1 py-0.5 font-mono text-[11px] text-foreground">
            downloadNow
          </code>
          {t("options.importBehaviour.descriptionMid")}
          <code className="mx-0.5 rounded-xs bg-surface-300 px-1 py-0.5 font-mono text-[11px] text-foreground">
            startDownload
          </code>
          {t("options.importBehaviour.descriptionTail")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ToggleRow
          label={t("options.importBehaviour.downloadNowLabel")}
          description={t("options.importBehaviour.downloadNowDesc")}
          checked={downloadNow}
          disabled={disabled}
          onCheckedChange={(v) => apply({ downloadNow: v })}
        />

        <ToggleRow
          label={t("options.importBehaviour.schemaSilentLabel")}
          description={
            schemaOnly
              ? t("options.importBehaviour.schemaSilentActive")
              : t("options.importBehaviour.schemaSilentInactive")
          }
          checked={schemaSilent}
          disabled={disabled || !schemaOnly}
          onCheckedChange={(v) => apply({ schemaSilent: v })}
        />
      </CardContent>
    </Card>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: ToggleRowProps) {
  const id = `toggle-${label}`;
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-200 p-4">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="font-serif text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
