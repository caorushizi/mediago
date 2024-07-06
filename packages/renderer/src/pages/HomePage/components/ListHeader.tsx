import React from "react";
import { Button } from "antd";
import { Trans, useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  onSelectAll: (checked: boolean) => void;
  checked: boolean | "indeterminate";
  selected: number[];
  onDeleteItems: (id: number[]) => void;
  onDownloadItems: (id: number[]) => void;
  onCancelItems: () => void;
}

export function ListHeader({
  onSelectAll,
  checked,
  selected,
  onDeleteItems,
  onDownloadItems,
  onCancelItems,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row items-center justify-between py-5 pl-3">
      <div className="flex flex-row items-center">
        <Checkbox checked={checked} onCheckedChange={onSelectAll} />
        <Button type="link" onClick={() => onSelectAll(true)}>
          {t("selectAll")}
        </Button>
        {!!selected.length && (
          <Trans i18nKey="selectedItems" values={{ count: selected.length }} />
        )}
      </div>
      <div className="flex flex-row items-center">
        <Button type="link" onClick={async () => onDeleteItems(selected)}>
          {t("delete")}
        </Button>
        <Button type="link" onClick={() => onCancelItems()}>
          {t("cancel")}
        </Button>
        <Button type="link" onClick={() => onDownloadItems(selected)}>
          {t("download")}
        </Button>
      </div>
    </div>
  );
}
