import { useMemoizedFn } from "ahooks";
import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Terminal from "@/components/download-terminal";
import useSWR from "swr";
import useAPI from "@/hooks/use-api";
import { GET_DOWNLOAD_LOG } from "@mediago/shared-common";
import { useTranslation } from "react-i18next";

interface Props {
  trigger: React.ReactNode;
  title: string;
  id: number;
  asChild?: boolean;
}

export function TerminalDialog({ trigger, title, id, asChild }: Props) {
  const { t } = useTranslation();
  const { getDownloadLog } = useAPI();
  const { data } = useSWR({ key: GET_DOWNLOAD_LOG, args: id }, ({ args }) =>
    getDownloadLog(args),
  );
  const handleContextMenu = useMemoizedFn(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
  );

  return (
    <Dialog>
      <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>
      <DialogContent onContextMenu={handleContextMenu} className="min-w-fit">
        <DialogHeader>
          <DialogTitle>{t("downloadLog")}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <Terminal id={id} log={data || ""} />
      </DialogContent>
    </Dialog>
  );
}
