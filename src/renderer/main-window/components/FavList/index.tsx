import React, { ReactNode, useCallback, useEffect, useState } from "react";
import "./index.scss";
import { Button, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  getFavs,
  insertFav,
  removeFav,
} from "renderer/common/scripts/localforge";
import { Fav } from "types/common";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";
import Card from "./Card";
import { ModalForm, ProFormText } from "@ant-design/pro-form";
import { isUrl } from "renderer/main-window/utils";
import onEvent from "renderer/common/scripts/td-utils";

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

  // 删除收藏
  const handleDelete = async (fav: Fav): Promise<void> => {
    onEvent.favPageDeleteLink();
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
        <ModalForm<Fav>
          width={500}
          layout="horizontal"
          title="添加收藏"
          trigger={
            <Button type="primary" icon={<PlusOutlined />}>
              添加收藏
            </Button>
          }
          onFinish={async (fav) => {
            onEvent.favPageAddFav();
            await insertFav(fav);
            const favs = await getFavs();
            setFavs(favs);
            return true;
          }}
        >
          <ProFormText
            required
            name="title"
            label="链接名称"
            placeholder="请输入链接名称"
            rules={[{ required: true, message: "请输入链接名称" }]}
          />
          <ProFormText
            required
            name="url"
            label="链接地址"
            placeholder="请输入链接地址"
            rules={[
              { required: true, message: "请输入链接地址" },
              {
                validator(rule, value: string, callback) {
                  if (!isUrl(value)) callback("请输入正确的 url 格式");
                  else callback();
                },
              },
            ]}
          />
        </ModalForm>
      </Space>
      {favs.length > 0 && (
        <div className="fav-wrapper">
          <DndProvider backend={HTML5Backend}>
            {favs.map((card, i) => renderCard(card, i))}
          </DndProvider>
        </div>
      )}
    </div>
  );
};

export default FavList;
