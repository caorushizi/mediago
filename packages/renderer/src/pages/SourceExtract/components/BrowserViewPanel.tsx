import { DeleteIcon } from "@/assets/svg";
import { IconButton } from "@/components/IconButton";
import { Button } from "@/components/ui/button";
import useElectron from "@/hooks/useElectron";
import {
  browserStoreSelector,
  setBrowserSelector,
  useBrowserStore,
} from "@/store/browser";
import React from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";

export function BrowserViewPanel() {
  const store = useBrowserStore(useShallow(browserStoreSelector));
  const { deleteSource } = useBrowserStore(useShallow(setBrowserSelector));
  const { t } = useTranslation();
  const { showDownloadDialog } = useElectron();

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto bg-white p-3 dark:bg-[#1F2024]">
      {store.sources.map((item, index) => {
        return (
          <div
            className="flex flex-col gap-2 rounded-lg bg-[#FAFCFF] p-2 dark:bg-[#27292F]"
            key={index}
          >
            <span
              className="line-clamp-2 cursor-default break-words text-sm text-[#343434] dark:text-[#B4B4B4]"
              title={item.name}
            >
              {item.name}
            </span>
            <span
              className="line-clamp-2 cursor-default break-words text-xs dark:text-[#515257]"
              title={item.url}
            >
              {item.url}
            </span>
            <div className="flex flex-row items-center justify-between gap-3">
              <div>
                <IconButton
                  icon={<DeleteIcon />}
                  onClick={() => deleteSource(item.url)}
                />
              </div>
              <Button size="sm" onClick={() => showDownloadDialog([item])}>
                {t("addToDownloadList")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
