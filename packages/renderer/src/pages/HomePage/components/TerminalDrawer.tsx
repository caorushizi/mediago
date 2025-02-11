import { CloseIcon } from "@/assets/svg";
import Terminal from "@/components/DownloadTerminal";
import { IconButton } from "@/components/IconButton";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMemoizedFn } from "ahooks";
import React from "react";

interface Props {
  trigger: React.ReactNode;
  title: string;
  id: number;
  log: string;
  asChild?: boolean;
}

export function TerminalDrawer({ trigger, title, id, log, asChild }: Props) {
  const handleContextMenu = useMemoizedFn(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
  );

  return (
    <Drawer handleOnly>
      <DrawerTrigger asChild={asChild}>{trigger}</DrawerTrigger>
      <DrawerContent className="px-3" onContextMenu={handleContextMenu}>
        <Terminal
          header={
            <div className="flex flex-shrink-0 flex-row items-center justify-between">
              {title}
              <DrawerClose>
                <IconButton icon={<CloseIcon />} />
              </DrawerClose>
            </div>
          }
          id={id}
          log={log}
        />
      </DrawerContent>
    </Drawer>
  );
}
