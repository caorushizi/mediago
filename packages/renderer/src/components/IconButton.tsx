/*
 * @Author: fenglei wfl12036@163.com
 * @Date: 2024-08-07 18:23:03
 * @LastEditors: fenglei wfl12036@163.com
 * @LastEditTime: 2024-08-07 18:32:52
 * @FilePath: /mediago/packages/renderer/src/components/IconButton.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { cn } from "@/utils";
import { useMemoizedFn } from "ahooks";
import React, { cloneElement, PropsWithChildren, ReactElement } from "react";

interface Props extends PropsWithChildren {
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactElement;
  highlight?: boolean;
}

// IconButton
export function IconButton({
  children,
  disabled,
  title,
  onClick,
  icon,
  highlight,
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
          "hover:bg-[#E1F0FF]": !disabled,
          "bg-[#00f]": highlight,
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
