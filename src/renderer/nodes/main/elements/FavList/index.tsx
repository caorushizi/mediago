import React, { ReactNode, useEffect, useState } from "react";
import "./index.scss";
import { Button, Col, Empty, Popconfirm, Row } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { getFavs, insertFav, removeFav } from "renderer/utils/localforge";
import { Fav } from "types/common";
import { ModalForm, ProFormText } from "@ant-design/pro-form";
import { isUrl } from "renderer/utils";
import onEvent from "renderer/utils/td-utils";

const FavList: React.FC = () => {
  const [favs, setFavs] = useState<Fav[]>([]);

  const initState = async (): Promise<void> => {
    const favList = await getFavs();
    setFavs(favList);
  };

  useEffect(() => {
    initState();
  }, []);

  // 删除收藏
  const handleDelete = async (fav: Fav): Promise<void> => {
    onEvent.favPageDeleteLink();
    await removeFav(fav);
    const favList = await getFavs();
    setFavs(favList);
  };

  // 渲染卡片
  const renderCard = (fav: Fav, index: number): ReactNode => (
    <div className="fav-item">
      <Row className="fav-item-inner" key={fav.url}>
        <Col span={18} className="fav-item__title">
          <span className="fav-item__inner">{fav.title}</span>
        </Col>
        <Col span={6} className="fav-item__action">
          <Button
            type="link"
            onClick={() => {
              onEvent.favPageOpenLink();
              window.electron.openBrowserWindow(fav.url);
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

  // 渲染添加按钮
  const renderAddFav = () => {
    return (
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
    );
  };

  return favs.length > 0 ? (
    <div className="fav-list">
      {renderAddFav()}
      {favs.map((card, i) => renderCard(card, i))}
    </div>
  ) : (
    <Empty>{renderAddFav()}</Empty>
  );
};

export default FavList;
