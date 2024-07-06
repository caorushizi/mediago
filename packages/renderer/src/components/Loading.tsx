import React, { FC } from "react";
import { Spin } from "antd";

const Loading: FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spin />
    </div>
  );
};

export default Loading;
