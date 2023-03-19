import classNames from "classnames";
import React, { FC } from "react";
import "./index.scss";

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
    <div className={classNames("page-container", className)}>
      {title && (
        <div className="page-container-header">
          <div className="page-container-header-title">
            <div className="title-text">{title}</div>
            <div className="title-extra">{titleExtra}</div>
          </div>
          <div className="page-container-header-right">{rightExtra}</div>
        </div>
      )}

      <div className={classNames("page-container-inner", `${className}-inner`)}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
