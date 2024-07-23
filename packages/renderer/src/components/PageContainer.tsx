import React, { FC } from "react";
import { cn } from "@/utils";

interface PageContainerProps {
  children: React.ReactNode | null;
  titleExtra?: React.ReactNode | null;
  rightExtra?: React.ReactNode | null;
  title?: React.ReactNode | null;
  className?: string;
  wrapperClassName?: string;
}

const PageContainer: FC<PageContainerProps> = ({
  children,
  titleExtra,
  rightExtra,
  title,
  className,
  wrapperClassName,
}) => {
  return (
    <div className={cn("flex h-full flex-col gap-3 p-3", wrapperClassName)}>
      {title && (
        <div className="flex flex-row items-center justify-between rounded-lg bg-white p-3 dark:bg-[#1F2024]">
          <div className="flex flex-row gap-3">
            <div className="text-sm text-[#343434] dark:text-white">
              {title}
            </div>
            {titleExtra && <div>{titleExtra}</div>}
          </div>
          {rightExtra && <div>{rightExtra}</div>}
        </div>
      )}

      <div className={cn("flex-1 overflow-auto", className)}>{children}</div>
    </div>
  );
};

export default PageContainer;
