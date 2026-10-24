import { useMemoizedFn } from "ahooks";
import { Plus } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/toast";
import emptyError from "@/assets/images/empty-states/empty-error.png";
import emptyFavorites from "@/assets/images/empty-states/empty-favorites.png";
import { AppEmptyState } from "@/components/app-empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ADD_FAVORITE, OPEN_FAVORITE } from "@/const";
import { tdApp } from "@/utils";
import { FavItem } from "./fav-item";
import { useFavorites } from "@/hooks/use-favorites";
import { usePlatform } from "@/hooks/use-platform";
import { useBrowserActions } from "@/hooks/use-browser-actions";
import { getPageTitle } from "@/api/util";
import { useFavoriteIconResolution } from "./use-favorite-icon-resolution";

export function FavoriteList() {
  const {
    data: favoriteList,
    isLoading,
    error,
    addFavorite,
    removeFavorite,
    resolveFavoriteIcon,
    mutate,
  } = useFavorites();
  const { contextMenu } = usePlatform();
  const { createTab, loadUrl } = useBrowserActions();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const urlInputId = useId();
  const titleInputId = useId();
  useFavoriteIconResolution(favoriteList, resolveFavoriteIcon);

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

  const handleOk = useMemoizedFn(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!url) {
      setUrlError(t("pleaseEnterSiteUrl"));
      return;
    }
    if (!/^https?:\/\/.+/.test(url)) {
      setUrlError(t("pleaseEnterCorrectUrl"));
      return;
    }

    setUrlError(null);
    try {
      await addFavorite({
        url,
        title,
      });
      setUrl("");
      setTitle("");
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.add({
        title:
          err instanceof Error && err.message
            ? err.message
            : t("addFavoriteFailed"),
        type: "error",
      });
    }
  });

  const handleCancel = useMemoizedFn(() => {
    setIsModalOpen(false);
  });

  const handleOpenChange = useMemoizedFn((open: boolean) => {
    setIsModalOpen(open);
  });

  // Auto-fill the title from the page's <title> tag when the user leaves
  // the URL field, unless they already typed a title themselves.
  const handleUrlBlur = useMemoizedFn(async () => {
    if (!url || !/^https?:\/\/.+/.test(url)) return;
    if (title) return;
    try {
      const { data: pageTitle } = await getPageTitle(url);
      // Re-check: the user may have typed something while we were fetching.
      if (pageTitle) {
        setTitle((currentTitle) => currentTitle || pageTitle);
      }
    } catch {
      // Best-effort: leave title blank if fetch fails; server falls back to URL.
    }
  });

  const handleContextMenu = useMemoizedFn(async (item: Favorite) => {
    const action = await contextMenu.show([
      { key: "open", label: t("open") },
      { key: "open-new-tab", label: t("openInNewTab") },
      { key: "separator", label: "", type: "separator" },
      { key: "delete", label: t("delete") },
    ]);
    if (action === "open") {
      loadUrl(item.url);
    } else if (action === "open-new-tab") {
      await createTab(item.url);
    } else if (action === "delete") {
      await removeFavorite(item.id);
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <AppEmptyState
          compact
          illustration={emptyError}
          title={t("loadFailed")}
          description={t("loadFailedDescription")}
          actions={
            <Button type="button" onClick={() => void mutate()}>
              {t("refresh")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto py-4">
      {favoriteList.length === 0 ? (
        <AppEmptyState
          className="min-h-full"
          illustration={emptyFavorites}
          title={t("emptyFavoritesTitle")}
          description={t("emptyFavoritesDescription")}
          actions={
            <Button type="button" onClick={showModal}>
              <Plus />
              {t("addFavorite")}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-4 place-items-center gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
          {favoriteList.map((item) => (
            <FavItem
              key={item.id}
              onContextMenu={() => handleContextMenu(item)}
              onClick={() => onClickLoadItem(item)}
              onClose={() => handleRemoveFavorite(item.id)}
              src={item.icon ?? undefined}
              title={item.title}
            />
          ))}
          <FavItem
            key={"add"}
            onClick={showModal}
            icon={<Plus className="size-5" />}
            title={t("addFavorite")}
          />
        </div>
      )}
      <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form className="flex flex-col gap-4" noValidate onSubmit={handleOk}>
            <DialogHeader>
              <DialogTitle>{t("addShortcut")}</DialogTitle>
              <DialogDescription className="sr-only">
                {t("pleaseEnterSiteUrl")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-36 flex-col justify-center gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={urlInputId}>
                  {t("siteUrl")}
                </label>
                <Input
                  id={urlInputId}
                  name="url"
                  value={url}
                  autoFocus
                  aria-invalid={Boolean(urlError)}
                  aria-describedby={
                    urlError ? `${urlInputId}-error` : undefined
                  }
                  onChange={(event) => {
                    setUrl(event.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  placeholder={t("pleaseEnterSiteUrl")}
                  onBlur={handleUrlBlur}
                />
                {urlError ? (
                  <p
                    id={`${urlInputId}-error`}
                    className="text-sm text-destructive"
                    role="alert"
                  >
                    {urlError}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={titleInputId}>
                  {t("siteName")}
                </label>
                <Input
                  id={titleInputId}
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("pleaseEnterSiteName")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t("cancel")}
              </Button>
              <Button type="submit">{t("confirm")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
