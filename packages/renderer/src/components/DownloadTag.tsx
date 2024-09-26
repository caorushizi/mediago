import { cn } from "@/utils";
import React from "react";

interface DownloadTagProps {
  icon?: React.ReactNode;
  text: string;
  color: string;
  className?: string;
}

export function DownloadTag({
  icon,
  text,
  color,
  className,
}: DownloadTagProps) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 cursor-default flex-row items-center gap-0.5 rounded-2xl rounded-bl-lg py-0.5 pl-1.5 pr-1.5",
        className,
      )}
      style={{ background: color }}
    >
      {icon}
      <span className="text-xs text-white">{text}</span>
    </div>
  );
}
