import { PlusOutlined } from "@ant-design/icons";
import { useMemoizedFn } from "ahooks";
import { App, Form, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { ADD_FAVORITE, OPEN_FAVORITE } from "@/const";
import {
  BrowserStatus,
  PageMode,
  setBrowserSelector,
  useBrowserStore,
} from "@/store/browser";
import { getFavIcon, tdApp } from "@/utils";
import { FavItem } from "./fav-item";
import { useFavorites } from "@/hooks/use-favorites";
import { usePlatform } from "@/hooks/use-platform";

export function FavoriteList() {
  const { data: favoriteList, addFavorite, removeFavorite } = useFavorites();
  const {
    webviewLoadURL,
    onFavoriteItemContextMenu,
    addIpcListener,
    removeIpcListener,
  } = usePlatform();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [favoriteAddForm] = Form.useForm<Favorite>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setBrowserStore } = useBrowserStore(useShallow(setBrowserSelector));

  const loadUrl = useMemoizedFn((url: string) => {
    setBrowserStore({
      url,
      mode: PageMode.Browser,
      status: BrowserStatus.Loading,
    });
    webviewLoadURL(url);
  });

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
      const icon = await getFavIcon(values.url);
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

  useEffect(() => {
    const handleLoadItem = (item: Favorite) => {
      setBrowserStore({
        url: item.url,
        mode: PageMode.Browser,
        status: BrowserStatus.Loading,
      });
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
        const found = favoriteList.find(
          (fav: Record<string, unknown>) => fav.id === payload,
        );
        if (found) {
          handleLoadItem(found);
        }
      } else if (action === "delete") {
        await removeFavorite(payload);
      }
    };

    addIpcListener("favorite-item-event", onFavoriteEvent);

    return () => {
      removeIpcListener("favorite-item-event", onFavoriteEvent);
    };
  }, [favoriteList]);

  return (
    <div className="h-full w-full py-4">
      <div className="grid grid-cols-4 place-items-center gap-4 overflow-auto md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
        {favoriteList.map((item: Record<string, unknown>) => {
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
