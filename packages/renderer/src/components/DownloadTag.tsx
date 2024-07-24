import { cn } from "@/utils";
import React from "react";

interface DownloadTagProps {
  icon?: React.ReactNode;
  text: string;
  color: string;
}

export function DownloadTag({ icon, text, color }: DownloadTagProps) {
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-[3px] rounded-2xl rounded-bl-lg pl-1 pr-2",
      )}
      style={{ background: color }}
    >
      {icon}
      <span className="text-xs text-white">{text}</span>
    </div>
  );
}
