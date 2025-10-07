import { Spin } from "antd";
import type { FC } from "react";

const Loading: FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white dark:bg-[#1F2024]">
      <Spin />
    </div>
  );
};

export default Loading;
