import { ADD_DOWNLOAD_ITEMS } from "@mediago/shared-common";
import axios from "axios";
import { useShallow } from "zustand/react/shallow";
import { appStoreSelector, useAppStore } from "@/store/app";

export function useDockerApi() {
  const { dockerUrl } = useAppStore(useShallow(appStoreSelector));

  const addVideosToDocker = ({
    items,
    immediate = false,
  }: {
    items: Omit<DownloadTask, "id">[];
    immediate?: boolean;
  }) => {
    return axios.post(`${dockerUrl}/api/${ADD_DOWNLOAD_ITEMS}`, {
      videos: items,
      startDownload: immediate,
    });
  };

  return {
    addVideosToDocker,
  };
}
