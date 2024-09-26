import React from "react";
import { DownloadIcon, DownloadBg1, DownloadBg2 } from "@/assets/svg";
import { useTranslation } from "react-i18next";

interface Props {
  onClick?: () => void;
}

export function HomeDownloadButton({ onClick }: Props) {
  const { t } = useTranslation();

  return (
    <div
      className="relative flex cursor-pointer flex-row items-center gap-2 overflow-hidden rounded-md bg-gradient-to-r from-[#24C1FF] to-[#823CFE] px-2 py-1 text-sm text-white"
      onClick={onClick}
    >
      <img
        className="absolute -left-0 bottom-0 top-0 h-full"
        src={DownloadBg2}
      />
      <img
        className="absolute -left-2 bottom-0 top-0 h-full"
        src={DownloadBg1}
      />
      <DownloadIcon fill="#fff" className="relative" />
      {t("newDownload")}
    </div>
  );
}
