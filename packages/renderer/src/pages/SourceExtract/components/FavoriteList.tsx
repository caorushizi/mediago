import useElectron from "@/hooks/electron";
import { BrowserStatus, PageMode, setBrowserStore } from "@/store";
import { getFavIcon } from "@/utils";
import { PlusOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Form, Input, message, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { FavItem } from "./FavItem";

export function FavoriteList() {
  const {
    getFavorites,
    addFavorite,
    removeFavorite,
    webviewLoadURL,
    onFavoriteItemContextMenu,
    addIpcListener,
    removeIpcListener,
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

  const handleRemoveFavorite = async (id: number) => {
    removeFavorite(id);
    refresh();
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

      setIsModalOpen(false);
    } catch (err: any) {
      messageApi.error(err.message || t("addFavoriteFailed"));
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const onClickLoadItem = (item: Favorite) => {
      dispatch(
        setBrowserStore({
          url: item.url,
          mode: PageMode.Browser,
          status: BrowserStatus.Loading,
        }),
      );
      webviewLoadURL(item.url);
    };

    const onFavoriteEvent = async (
      e: unknown,
      {
        action,
        payload,
      }: {
        action: string;
        payload: number;
      },
    ) => {
      if (action === "open") {
        const item = favoriteList.find((item) => item.id === payload);
        if (item) {
          onClickLoadItem(item);
        }
      } else if (action === "delete") {
        await removeFavorite(payload);
        refresh();
      }
    };

    addIpcListener("favorite-item-event", onFavoriteEvent);

    return () => {
      removeIpcListener("favorite-item-event", onFavoriteEvent);
    };
  }, []);

  return (
    <div className="h-full w-full py-4">
      {contextHolder}
      <div className="grid grid-cols-4 place-items-center gap-4 overflow-auto md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
        {favoriteList.map((item) => {
          return (
            <FavItem
              key={item.id}
              onContextMenu={() => onFavoriteItemContextMenu(item.id)}
              onClick={() => onClickLoadItem(item)}
              onClose={() => handleRemoveFavorite(item.id)}
              src={item.icon}
              title={item.title}
            />
          );
        })}
        <FavItem
          key={"add"}
          onClick={showModal}
          icon={<PlusOutlined />}
          title={t("addFavorite")}
        />
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
    </div>
  );
}
