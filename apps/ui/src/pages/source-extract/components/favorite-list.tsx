import { PlusOutlined } from "@ant-design/icons";
import { useMemoizedFn } from "ahooks";
import { App, Form, Input, Modal, Spin } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ADD_FAVORITE, OPEN_FAVORITE } from "@/const";
import { getFavIcon, tdApp } from "@/utils";
import { FavItem } from "./fav-item";
import { useFavorites } from "@/hooks/use-favorites";
import { usePlatform } from "@/hooks/use-platform";
import { useBrowserActions } from "@/hooks/use-browser-actions";

export function FavoriteList() {
  const {
    data: favoriteList,
    isLoading,
    error,
    addFavorite,
    removeFavorite,
  } = useFavorites();
  const { contextMenu } = usePlatform();
  const { loadUrl } = useBrowserActions();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [favoriteAddForm] = Form.useForm<Favorite>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onClickLoadItem = useMemoizedFn((item: Favorite) => {
    loadUrl(item.url);
    tdApp.onEvent(OPEN_FAVORITE);
  });

  const handleRemoveFavorite = useMemoizedFn(async (id: number) => {
    await removeFavorite(id);
  });

  const showModal = useMemoizedFn(() => {
    setIsModalOpen(true);
    tdApp.onEvent(ADD_FAVORITE);
  });

  const handleOk = useMemoizedFn(async () => {
    try {
      const values = await favoriteAddForm.validateFields();
      const icon = getFavIcon(values.url);
      await addFavorite({
        url: values.url,
        title: values.title,
        icon,
      });
      favoriteAddForm.resetFields();

      setIsModalOpen(false);
    } catch (err: unknown) {
      message.error((err as Error).message || t("addFavoriteFailed"));
    }
  });

  const handleCancel = useMemoizedFn(() => {
    setIsModalOpen(false);
  });

  const handleContextMenu = useMemoizedFn(async (item: Favorite) => {
    const action = await contextMenu.show([
      { key: "open", label: t("open") },
      { key: "separator", label: "", type: "separator" },
      { key: "delete", label: t("delete") },
    ]);
    if (action === "open") {
      loadUrl(item.url);
    } else if (action === "delete") {
      await removeFavorite(item.id);
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center text-red-500">
        {t("loadFailed")}
      </div>
    );
  }

  return (
    <div className="h-full w-full py-4">
      <div className="grid grid-cols-4 place-items-center gap-4 overflow-auto md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
        {favoriteList.map((item) => (
          <FavItem
            key={item.id}
            onContextMenu={() => handleContextMenu(item)}
            onClick={() => onClickLoadItem(item)}
            onClose={() => handleRemoveFavorite(item.id)}
            src={item.icon}
            title={item.title}
          />
        ))}
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
        destroyOnHidden
        okText={t("confirm")}
        cancelText={t("cancel")}
      >
        <div className="flex min-h-36 flex-col justify-center">
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
        </div>
      </Modal>
    </div>
  );
}
