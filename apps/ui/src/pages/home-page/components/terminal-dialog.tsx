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

  // Radix Dialog portals the DOM to document.body, but React synthetic
  // events still bubble up through the React tree — that means a
  // right-click inside this dialog would otherwise propagate to the
  // underlying DownloadTaskItem's `onContextMenu` and pop its "select /
  // download / refresh / delete" menu instead of the native "Copy"
  // menu. Stop React-level bubbling so the item handler is isolated;
  // don't preventDefault, so Chromium's built-in context menu still
  // fires for the xterm selection.
  const stopContextPropagation = useMemoizedFn(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    },
  );

  return (
    <Dialog>
      <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>
      <DialogContent
        className="min-w-fit"
        onContextMenu={stopContextPropagation}
      >
        <DialogHeader>
          <DialogTitle>{t("downloadLog")}</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <Terminal id={id} />
      </DialogContent>
    </Dialog>
  );
}
