import React, { useRef } from "react";
import { DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import { XYCoord } from "dnd-core";
import { Button, Col, Popconfirm, Row } from "antd";
import { Fav } from "types/common";
import { DragOutlined } from "@ant-design/icons";
import onEvent from "renderer/common/scripts/td-utils";
import { ipcRenderer } from "renderer/common/scripts/electron";

const ItemTypes = {
  CARD: "card",
};

interface CardProps {
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  fav: Fav;
  handleDelete: (fav: Fav) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const Card: React.FC<CardProps> = ({ index, moveCard, fav, handleDelete }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => ({ id: fav.url, index }),
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  return (
    <div className="fav-item" ref={ref} data-handler-id={handlerId}>
      <Row className="fav-item-inner" key={fav.url}>
        <Col span={18} className="fav-item__title">
          <DragOutlined />
          <span className="fav-item__inner">{fav.title}</span>
        </Col>
        <Col span={6} className="fav-item__action">
          <Button
            type="link"
            onClick={() => {
              onEvent.favPageOpenLink();
              ipcRenderer.send("openBrowserWindow", fav.url);
            }}
          >
            打开链接
          </Button>
          <Popconfirm
            placement="topRight"
            title="确认要删除这个收藏吗？"
            onConfirm={() => handleDelete(fav)}
            okText="删除"
            okButtonProps={{ danger: true }}
            cancelText="取消"
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Col>
      </Row>
    </div>
  );
};

export default Card;
