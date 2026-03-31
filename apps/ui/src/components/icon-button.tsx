import { useMemoizedFn } from "ahooks";
import {
  cloneElement,
  memo,
  type PropsWithChildren,
  type ReactElement,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { themeSelector, useSessionStore } from "@/store/session";
import { cn } from "@/utils";

interface Props extends PropsWithChildren {
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactElement;
}

export const IconButton = memo(function IconButton({
  children,
  disabled,
  title,
  onClick,
  icon,
}: Props) {
  const { theme } = useSessionStore(useShallow(themeSelector));
  const handleClick = useMemoizedFn(() => {
    if (disabled) {
      return;
    }
    onClick?.();
  });

  return (
    <div
      className={cn(
        "flex h-4 w-4 shrink-0 cursor-pointer flex-row items-center justify-center rounded-sm hover:opacity-70",
        {
          "cursor-not-allowed": disabled,
          "opacity-50": disabled,
        },
      )}
      title={title}
      onClick={handleClick}
    >
      {icon &&
        cloneElement(icon, {
          className: cn(
            "w-full h-full text-[#020817] dark:text-[#B4B4B4]",
            icon.props.className,
          ),
          fill: theme === "dark" ? "#B4B4B4" : "#020817",
        })}
      {children}
    </div>
  );
});
