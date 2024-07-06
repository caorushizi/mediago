import useElectron from "@/hooks/electron";
import { BrowserStatus, PageMode, setBrowserStore } from "@/store";
import { getFavIcon } from "@/utils";
import { CloseOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Avatar, Button, Form, Input, message, Modal } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

export function FavoriteList() {
  const {
    getFavorites,
    addFavorite,
    removeFavorite,
    webviewLoadURL,
    onFavoriteItemContextMenu,
  } = useElectron();
  const { data: favoriteList = [], refresh } = useRequest(getFavorites);
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [favoriteAddForm] = Form.useForm<Favorite>();
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUrl = (url: string) => {
    dispatch(
      setBrowserStore({
        url,
        mode: PageMode.Browser,
        status: BrowserStatus.Loading,
      }),
    );
    webviewLoadURL(url);
  };

  const onClickLoadItem = (item: Favorite) => {
    loadUrl(item.url);
  };

  // 渲染收藏 item
  const renderFavoriteItem = (item: Favorite | "add") => {
    if (item === "add") {
      return (
        <div onClick={() => showModal()}>
          <PlusOutlined style={{ fontSize: "20px" }} />
        </div>
      );
    }

    return (
      <div
        key={item.id}
        className="flex h-16 w-16 flex-col items-center justify-center overflow-hidden rounded-lg"
        onContextMenu={() => {
          onFavoriteItemContextMenu(item.id);
        }}
        onClick={() => onClickLoadItem(item)}
      >
        <Button
          className="absolute right-1 top-1 hidden"
          type="link"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            removeFavorite(item.id);
            refresh();
          }}
        >
          <CloseOutlined />
        </Button>
        {item.icon ? (
          <Avatar shape="square" src={item.icon} icon={<LinkOutlined />} />
        ) : (
          <Avatar shape="square" icon={<LinkOutlined />} />
        )}
        <div className="w-full truncate text-center" title={item.title}>
          {item.title}
        </div>
      </div>
    );
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await favoriteAddForm.validateFields();
      const icon = await getFavIcon(values.url);
      await addFavorite({
        url: values.url,
        title: values.title,
        icon,
      });
      favoriteAddForm.resetFields();
      refresh();
      return true;
    } catch (err: any) {
      messageApi.error(err.message);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {contextHolder}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {([...favoriteList, "add"] as (Favorite | "add")[]).map((item) => {
          return renderFavoriteItem(item);
        })}
      </div>
      <Modal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        title={t("addShortcut")}
        width={500}
        destroyOnClose
      >
        <Form<Favorite> form={favoriteAddForm} autoFocus>
          <Form.Item
            name="title"
            label={t("siteName")}
            rules={[
              {
                required: true,
                message: t("pleaseEnterSiteName"),
              },
            ]}
          >
            <Input placeholder={t("pleaseEnterSiteName")} />
          </Form.Item>
          <Form.Item
            name="url"
            label={t("siteUrl")}
            rules={[
              {
                required: true,
                message: t("pleaseEnterSiteUrl"),
              },
              {
                pattern: /^https?:\/\/.+/,
                message: t("pleaseEnterCorrectUrl"),
              },
            ]}
          >
            <Input placeholder={t("pleaseEnterSiteUrl")} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
