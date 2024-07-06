import React, { FC } from "react";
import { cn } from "@/utils";

interface PageContainerProps {
  children: React.ReactNode | null;
  titleExtra?: React.ReactNode | null;
  rightExtra?: React.ReactNode | null;
  title?: string;
  className?: string;
}

const PageContainer: FC<PageContainerProps> = ({
  children,
  titleExtra,
  rightExtra,
  title,
  className,
}) => {
  return (
    <div className={cn("flex h-full flex-col gap-3 p-3", className)}>
      {title && (
        <div className="flex flex-row items-center justify-between rounded-lg bg-white p-3">
          <div className="flex flex-row gap-3">
            <div>{title}</div>
            <div>{titleExtra}</div>
          </div>
          <div>{rightExtra}</div>
        </div>
      )}

      <div
        className={cn(
          "flex-1 overflow-auto rounded-lg bg-white p-3",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
