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
import { useTranslation } from "react-i18next";

interface Props {
  trigger: React.ReactNode;
  title: string;
  id: number;
  asChild?: boolean;
}

export function TerminalDialog({ trigger, title, id, asChild }: Props) {
  const { t } = useTranslation();
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
        <Terminal id={id} />
      </DialogContent>
    </Dialog>
  );
}
