import classNames from "classnames";
import React, { FC } from "react";
import "./index.scss";

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
    <div className={classNames("page-container", className, extraClassName)}>
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
