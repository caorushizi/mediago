import useElectron from "@/hooks/electron";
import { BrowserStatus, PageMode, setBrowserStore } from "@/store";
import { getFavIcon } from "@/utils";
import { CloseOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Form, Input, message, Modal } from "antd";
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

  const handleRemoveFavorite = async (e: any, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(id);
    refresh();
  };

  // 渲染收藏 item
  const renderFavoriteItem = (item: Favorite | "add") => {
    if (item === "add") {
      return (
        <div
          className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden"
          onClick={() => showModal()}
        >
          <PlusOutlined style={{ fontSize: "20px" }} />
        </div>
      );
    }

    return (
      <div
        key={item.id}
        className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden"
        onContextMenu={() => {
          onFavoriteItemContextMenu(item.id);
        }}
        onClick={() => onClickLoadItem(item)}
      >
        <div
          className="absolute right-1 top-1 hidden"
          onClick={(e) => handleRemoveFavorite(e, item.id)}
        >
          <CloseOutlined />
        </div>
        <div className="flex h-14 w-14 flex-row items-center justify-center rounded-lg bg-white">
          {item.icon ? (
            <img className="h-8 w-8" src={item.icon} />
          ) : (
            <LinkOutlined />
          )}
        </div>
        <div
          className="w-full truncate text-center text-sm text-[#636D7E]"
          title={item.title}
        >
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
