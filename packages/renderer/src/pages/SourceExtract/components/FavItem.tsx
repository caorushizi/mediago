import { CloseIcon } from "@/assets/svg";
import { LinkOutlined } from "@ant-design/icons";
import { Avatar } from "antd";
import React, { ReactElement } from "react";

interface Props {
  onContextMenu?: () => void;
  onClick?: () => void;
  onClose?: () => void;
  src?: string;
  icon?: ReactElement;
  title?: string;
}

export function FavItem({
  onContextMenu,
  onClick,
  onClose,
  src,
  icon,
  title,
}: Props) {
  return (
    <div
      className="group relative flex min-h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden"
      onContextMenu={onContextMenu}
      onClick={onClick}
    >
      {onClose && (
        <div
          className="absolute right-1 top-1 hidden group-hover:block"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
        >
          <CloseIcon width={15} height={15} />
        </div>
      )}
      <div className="flex h-14 w-14 flex-row items-center justify-center rounded-lg bg-white dark:bg-[#27292F]">
        <Avatar
          size={35}
          src={src}
          shape="square"
          icon={icon || <LinkOutlined size={35} />}
          className="bg-white text-[#27292F] dark:bg-[#27292F] dark:text-white"
        />
      </div>
      <div
        className="w-full truncate text-center text-sm text-[#636D7E]"
        title={title}
      >
        {title}
      </div>
    </div>
  );
}
