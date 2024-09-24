import React from "react";
import { Button } from "antd";
import { Trans, useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { DownloadFilter } from "@/types";

interface Props {
  onSelectAll: (checked: boolean) => void;
  checked: boolean | "indeterminate";
  selected: number[];
  onDeleteItems: (id: number[]) => void;
  onDownloadItems: (id: number[]) => void;
  onCancelItems: () => void;
  filter: DownloadFilter;
}

export function ListHeader({
  onSelectAll,
  checked,
  selected,
  onDeleteItems,
  onDownloadItems,
  onCancelItems,
  filter,
}: Props) {
  const { t } = useTranslation();

  const disabled = selected.length === 0;

  return (
    <div className="flex flex-row items-center justify-between pb-2 pl-3">
      <div className="flex flex-row items-center gap-3">
        <Checkbox checked={checked} onCheckedChange={onSelectAll} />
        <span
          className="cursor-pointer text-sm text-[#343434] dark:text-white"
          onClick={() => onSelectAll(true)}
        >
          {t("selectAll")}
        </span>
        {!!selected.length && (
          <span className="text-xs text-[#A4A4A4]">
            <Trans
              i18nKey="selectedItems"
              values={{ count: selected.length }}
            />
          </span>
        )}
      </div>
      <div className="flex flex-row items-center gap-3">
        <Button
          disabled={disabled}
          onClick={async () => onDeleteItems(selected)}
        >
          {t("delete")}
        </Button>
        <Button disabled={disabled} onClick={() => onCancelItems()}>
          {t("cancel")}
        </Button>
        {filter === DownloadFilter.list && (
          <Button
            disabled={disabled}
            type="primary"
            onClick={() => onDownloadItems(selected)}
          >
            {t("download")}
          </Button>
        )}
      </div>
    </div>
  );
}
