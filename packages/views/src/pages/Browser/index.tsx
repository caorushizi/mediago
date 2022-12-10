import React, { FC, useEffect, useRef } from "react";
import "./index.scss";
import { useSize } from "ahooks";

const Browser: FC = () => {
  const browserInner = useRef(null);
  const downloadListSize = useSize(browserInner);

  useEffect(() => {
    console.log("downloadListSize", downloadListSize);
    console.log(window.myAPI);
    window.myAPI.changeViewSize(downloadListSize);
  }, [downloadListSize]);
  return (
    <div className="container">
      <div ref={browserInner} className={"inner"}></div>
    </div>
  );
};

export default Browser;
