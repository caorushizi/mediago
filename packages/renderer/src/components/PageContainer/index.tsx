import React, { FC } from "react";
import "./index.scss";
import { Space, Typography } from "antd";
import { cn } from "@/utils";

const { Text } = Typography;

interface PageContainerProps {
  children: React.ReactNode | null;
  titleExtra?: React.ReactNode | null;
  rightExtra?: React.ReactNode | null;
  title?: string;
  className?: string;
  extraClassName?: string;
}

const PageContainer: FC<PageContainerProps> = ({
  children,
  titleExtra,
  rightExtra,
  title,
  className,
  extraClassName,
}) => {
  return (
    <div className={cn("page-container", className, extraClassName)}>
      {title && (
        <div className="page-container-header">
          <Space>
            <Text style={{ fontSize: 18, fontWeight: 600 }}>{title}</Text>
            <div className="title-extra">{titleExtra}</div>
          </Space>
          <div className="page-container-header-right">{rightExtra}</div>
        </div>
      )}

      <div className={cn("page-container-inner", `${className}-inner`)}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
