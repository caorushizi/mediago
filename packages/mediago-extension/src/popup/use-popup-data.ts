import { useCallback, useEffect, useState } from "react";

import type {
  DetectedSource,
  ExtensionMessage,
  ExtensionResponse,
  ExtensionSettings,
  LocalizedMessage,
  ServerStatus,
} from "@/shared/types";

async function sendMessage<T extends ExtensionResponse>(
  msg: ExtensionMessage,
): Promise<T> {
  return (await chrome.runtime.sendMessage(msg)) as T;
}

interface PopupData {
  tab: chrome.tabs.Tab | null;
  sources: DetectedSource[];
  settings: ExtensionSettings | null;
  serverStatus: ServerStatus | null;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
  importAll: () => Promise<void>;
  importOne: (source: DetectedSource) => Promise<void>;
  importing: boolean;
}

/**
 * Toast payload kind — the background may send either a ready-made
 * string (HTTP/network error from the server) or a translation
 * descriptor owned by the extension. The caller renders it.
 */
export type ToastValue =
  | string
  | LocalizedMessage
  | undefined
  | { key: "popup.imported"; values: { count: number } };

/**
 * Encapsulates every round-trip the popup makes to the background
 * worker. Also resolves the current mode → status probe policy:
 *
 * - `desktop-http` / `docker-http` — hit `/healthy` to flag green/red.
 * - `desktop-schema` — no silent probe possible (would cause an OS
 *   handoff every time the popup opens); we report a neutral "Schema"
 *   badge and let the user use the options page's Test button for
 *   the one-shot ping check.
 */
export function usePopupData(
  onToast: (kind: "success" | "error", value: ToastValue) => void,
): PopupData {
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const [sources, setSources] = useState<DetectedSource[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async () => {
    const [active] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!active?.id) return;
    setTab(active);

    const sourcesRes = await sendMessage<ExtensionResponse>({
      type: "GET_SOURCES",
      tabId: active.id,
    });
    if (sourcesRes.type === "SOURCES") setSources(sourcesRes.sources);

    const settingsRes = await sendMessage<ExtensionResponse>({
      type: "GET_SETTINGS",
    });
    if (settingsRes.type !== "SETTINGS") return;
    setSettings(settingsRes.settings);

    if (settingsRes.settings.mode === "desktop-schema") {
      // Silent probe would spawn an OS handoff every time the popup
      // opens. Just flag the mode instead.
      setServerStatus({ ok: true, message: { key: "status.schemaMode" } });
      return;
    }
    const statusRes = await sendMessage<ExtensionResponse>({
      type: "TEST_CONNECTION",
      mode: settingsRes.settings.mode,
      serverUrl: settingsRes.settings.serverUrl,
      apiKey: settingsRes.settings.apiKey,
    });
    if (statusRes.type === "STATUS") setServerStatus(statusRes.status);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    if (!tab?.id) return;
    await sendMessage({ type: "CLEAR_SOURCES", tabId: tab.id });
    setSources([]);
  }, [tab?.id]);

  const runImport = useCallback(
    async (items: DetectedSource[]) => {
      if (items.length === 0) return;
      setImporting(true);
      try {
        const res = await sendMessage<ExtensionResponse>({
          type: "IMPORT_SOURCES",
          sources: items,
        });
        if (res.type === "IMPORT_RESULT") {
          if (res.ok) {
            onToast("success", {
              key: "popup.imported",
              values: { count: res.count },
            });
          } else {
            onToast("error", res.error);
          }
        }
      } finally {
        setImporting(false);
      }
    },
    [onToast],
  );

  const importAll = useCallback(() => runImport(sources), [runImport, sources]);
  const importOne = useCallback(
    (source: DetectedSource) => runImport([source]),
    [runImport],
  );

  return {
    tab,
    sources,
    settings,
    serverStatus,
    refresh,
    clear,
    importAll,
    importOne,
    importing,
  };
}
