import { type DownloadTask, IpcEvent } from "@mediago/shared-common";
import { useEffect, useId, useRef } from "react";
import DownloadForm, { type DownloadFormRef } from "@/components/download-form";
import { usePlatform } from "@/hooks/use-platform";

import "./index.css";

export default function OverlayDialog() {
  const { on, off, browser } = usePlatform();
  const downloadForm = useRef<DownloadFormRef>(null);
  const dialogId = useId();

  useEffect(() => {
    const onShowOverlayDialog = (
      _e: unknown,
      data: Omit<DownloadTask, "id">[],
    ) => {
      const item = data[0];
      downloadForm.current?.openModal({
        batch: false,
        type: item.type,
        url: item.url,
        name: item.name,
        headers: item.headers,
      });
    };

    on(IpcEvent.browser.showOverlayDialog, onShowOverlayDialog);

    return () => {
      off(IpcEvent.browser.showOverlayDialog, onShowOverlayDialog);
    };
  }, [on, off]);

  const handleFormVisibleChange = (visible: boolean) => {
    if (!visible) {
      browser.dismissOverlayDialog();
    }
  };

  return (
    <DownloadForm
      id={dialogId}
      isEdit
      ref={downloadForm}
      destroyOnClose
      onFormVisibleChange={handleFormVisibleChange}
    />
  );
}
