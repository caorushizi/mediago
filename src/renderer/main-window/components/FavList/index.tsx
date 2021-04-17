import React, { ReactNode, useCallback, useEffect, useState } from "react";
import "./index.scss";
import { Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getFavs, removeFav } from "renderer/common/scripts/localforge";
import { Fav } from "types/common";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";
import Card from "./Card";

interface Props {}

const FavList: React.FC<Props> = () => {
  const [favs, setFavs] = useState<Fav[]>([]);

  const initState = async (): Promise<void> => {
    const favList = await getFavs();
    setFavs(favList);
  };

  useEffect(() => {
    initState();
  }, []);

  // 移动卡片
  const moveCard = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragCard = favs[dragIndex];
      setFavs(
        update(favs, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragCard],
          ],
        })
      );
    },
    [favs]
  );

  const handleDelete = async (fav: Fav): Promise<void> => {
    await removeFav(fav);
    const favList = await getFavs();
    setFavs(favList);
  };

  // 渲染卡片
  const renderCard = (fav: Fav, index: number): ReactNode => (
    <Card
      handleDelete={handleDelete}
      key={fav.url}
      index={index}
      moveCard={moveCard}
      fav={fav}
    />
  );

  return (
    <div className="fav-list">
      <Space className="button-wrapper">
        <Button type="primary" icon={<PlusOutlined />}>
          添加收藏
        </Button>
      </Space>
      <div className="fav-wrapper">
        <DndProvider backend={HTML5Backend}>
          <div>{favs.map((card, i) => renderCard(card, i))}</div>
        </DndProvider>
      </div>
    </div>
  );
};

export default FavList;
