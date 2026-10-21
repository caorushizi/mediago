import { CircleAlert, CircleCheck } from "lucide-react";
import { useMemo } from "react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BatchUrlTextarea } from "@/components/batchurl-textarea";
import type { DownloadFormItem } from "@/store/download-dialog";
import { parseBatchDownloadRows } from "./download-form-logic";

interface BatchDownloadFieldProps {
  form: UseFormReturn<DownloadFormItem>;
  formId: string;
  onShowTextMenu: () => void;
}

export function BatchDownloadField({
  form,
  formId,
  onShowTextMenu,
}: BatchDownloadFieldProps) {
  const { t } = useTranslation();
  const batchText = useWatch({ control: form.control, name: "batchList" });
  const batchRows = useMemo(
    () => parseBatchDownloadRows(batchText ?? ""),
    [batchText],
  );
  const validBatchCount = batchRows.filter((row) => row.valid).length;

  return (
    <>
      <Controller
        control={form.control}
        name="batchList"
        rules={{
          validate: (value) => {
            const rows = parseBatchDownloadRows(value ?? "");
            if (rows.length === 0) return t("pleaseEnterVideoLink");
            return rows.every((row) => row.valid)
              ? true
              : t("pleaseEnterCorrectBatchList");
          },
        }}
        render={({ field }) => (
          <BatchUrlTextarea
            {...field}
            id={`${formId}-batch-list`}
            value={field.value ?? ""}
            rows={5}
            placeholder={t("videoLikeDescription")}
            onContextMenu={onShowTextMenu}
            aria-invalid={Boolean(form.formState.errors.batchList)}
            aria-describedby={
              form.formState.errors.batchList
                ? `${formId}-batch-list-error ${formId}-batch-list-help`
                : `${formId}-batch-list-help`
            }
          />
        )}
      />
      <p
        id={`${formId}-batch-list-help`}
        className="text-xs leading-relaxed text-muted-foreground"
      >
        {t("batchListHelp")}
      </p>
      <div className="overflow-hidden rounded-md border bg-surface-subtle/40">
        <div className="flex items-center justify-between border-b px-3 py-2 text-xs font-medium">
          <span>{t("parsePreview")}</span>
          <span className="flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-success">
              <CircleCheck className="size-3.5" />
              {t("validCount", { count: validBatchCount })}
            </span>
            <span className="inline-flex items-center gap-1 text-destructive">
              <CircleAlert className="size-3.5" />
              {t("invalidCount", {
                count: batchRows.length - validBatchCount,
              })}
            </span>
          </span>
        </div>
        <div className="max-h-36 overflow-y-auto p-2">
          {batchRows.length > 0 ? (
            batchRows.map((row) => (
              <div
                key={`${row.line}:${row.url}`}
                className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded px-2 py-1 text-xs odd:bg-surface"
              >
                <span className="text-muted-foreground">{row.line}</span>
                <span className="truncate font-mono" title={row.url}>
                  {row.url}
                </span>
                {row.valid ? (
                  <CircleCheck className="size-3.5 text-success" />
                ) : (
                  <CircleAlert className="size-3.5 text-destructive" />
                )}
              </div>
            ))
          ) : (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {t("batchEmptyHint")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
