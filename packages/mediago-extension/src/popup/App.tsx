import { useTranslation } from "react-i18next";
import { toast } from "../components/ui/toast";

import { renderLocalized } from "../i18n/localized-message";

import { PopupView } from "./popup-view";
import { usePopupData } from "./use-popup-data";

export function App() {
  const { t } = useTranslation();
  const data = usePopupData((kind, value) => {
    const text = renderLocalized(t, value, "popup.importFailed");
    if (kind === "success") toast.add({ title: text, type: "success" });
    else toast.add({ title: text, type: "error" });
  });

  return (
    <PopupView
      tab={data.tab}
      sources={data.sources}
      settings={data.settings}
      serverStatus={data.serverStatus}
      loading={data.loading}
      loadError={data.loadError}
      importing={data.importing}
      onRetry={() => void data.refresh()}
      onClear={() => void data.clear()}
      onImportAll={() => void data.importAll()}
      onImport={(source) => void data.importOne(source)}
      onOpenSettings={() => void chrome.runtime.openOptionsPage()}
      onReloadPage={() => {
        if (data.tab?.id) void chrome.tabs.reload(data.tab.id);
      }}
    />
  );
}
