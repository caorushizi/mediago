import { ThemeContext } from "@/context/ThemeContext";
import { cn } from "@/utils";
import { useMemoizedFn } from "ahooks";
import React, {
  cloneElement,
  PropsWithChildren,
  ReactElement,
  useContext,
} from "react";

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
  const theme = useContext(ThemeContext);
  const handleClick = useMemoizedFn(() => {
    if (disabled) {
      return;
    }
    onClick && onClick();
  });

  return (
    <div
      className={cn(
        "flex h-4 w-4 flex-shrink-0 cursor-pointer flex-row items-center justify-center rounded-sm hover:opacity-70",
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
}
