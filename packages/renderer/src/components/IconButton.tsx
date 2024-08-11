import { cn } from "@/utils";
import { useMemoizedFn } from "ahooks";
import React, { cloneElement, PropsWithChildren, ReactElement } from "react";

interface Props extends PropsWithChildren {
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactElement;
}

// IconButton
export function IconButton({
  children,
  disabled,
  title,
  onClick,
  icon,
}: Props) {
  const handleClick = useMemoizedFn(() => {
    if (disabled) {
      return;
    }
    onClick && onClick();
  });

  return (
    <div
      className={cn(
        "flex h-6 w-6 flex-shrink-0 flex-row items-center justify-center rounded-sm p-1",
        {
          "cursor-not-allowed": disabled,
          "opacity-50": disabled,
          "hover:bg-[#E1F0FF] dark:hover:bg-[#1F2024]": !disabled,
        },
      )}
      title={title}
      onClick={handleClick}
    >
      {icon &&
        cloneElement(icon, {
          className: cn("w-full h-full", icon.props.className),
        })}
      {children}
    </div>
  );
}
