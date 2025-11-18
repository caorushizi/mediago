import { useLocation } from "react-router-dom";
import useAPI from "./use-api";
import { useEffect } from "react";
import { isDownloadType, isWeb, urlDownloadType } from "@/utils";
import { DownloadTask } from "@mediago/shared-common";
import { DownloadFormItem } from "@/components/download-form";
import qs from "qs";

export interface UseUrlInvokeProps {
  onOpenForm?: (item: DownloadFormItem) => void;
  refresh?: () => void;
}

export function useUrlInvoke({ onOpenForm, refresh }: UseUrlInvokeProps) {
  const { createDownloadTasks } = useAPI();
  const location = useLocation();

  useEffect(() => {
    if (isWeb) return;

    const {
      n,
      silent,
      encodedURL,
      url,
      name,
      type: typeParam,
      headers,
      downloadNow,
    } = qs.parse(location.search, { ignoreQueryPrefix: true }) as Record<
      string,
      string
    >;

    // new
    if (n) {
      const type = isDownloadType(typeParam) ? typeParam : urlDownloadType(url);
      const finalURL = encodedURL || url;

      if (silent) {
        const item: Omit<DownloadTask, "id"> = {
          type,
          url: finalURL,
          name,
          headers,
          folder: "",
        };
        createDownloadTasks([item], !!downloadNow);
        refresh?.();
      } else {
        const item: DownloadFormItem = {
          batch: false,
          type,
          url: finalURL,
          name,
          headers,
        };

        onOpenForm?.(item);
      }
    }
  }, [location.search]);
}
