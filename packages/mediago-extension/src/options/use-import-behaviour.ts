import { useCallback, useEffect, useState } from "react";

import type {
  ExtensionMessage,
  ExtensionResponse,
  ExtensionSettings,
} from "@/shared/types";

async function sendMessage<T extends ExtensionResponse>(
  msg: ExtensionMessage,
): Promise<T> {
  return (await chrome.runtime.sendMessage(msg)) as T;
}

/**
 * Read settings + expose a patch-style save helper. The import-
 * behaviour card toggles each knob independently, so we avoid the
 * "edit form + click Save" dance used by the server card and just
 * persist every change immediately.
 */
export function useImportBehaviour() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await sendMessage<ExtensionResponse>({
        type: "GET_SETTINGS",
      });
      if (res.type === "SETTINGS") setSettings(res.settings);
    })();
  }, []);

  const patch = useCallback(
    async (update: Partial<ExtensionSettings>): Promise<boolean> => {
      if (!settings) return false;
      const next = { ...settings, ...update };
      const res = await sendMessage<ExtensionResponse>({
        type: "SAVE_SETTINGS",
        settings: next,
      });
      if (res.type === "OK") {
        setSettings(next);
        return true;
      }
      return false;
    },
    [settings],
  );

  return { settings, patch };
}
