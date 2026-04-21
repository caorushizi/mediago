import { useCallback, useEffect, useState } from "react";

import type {
  ExtensionLanguage,
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
 * Read / write the `language` knob on top of the persisted settings.
 * Separated from useOptions / useImportBehaviour so each options card
 * owns its own loading state — simpler than a single monolithic store.
 *
 * Writes merge on top of the current persisted settings so we don't
 * wipe fields managed by other cards (mode, serverUrl, downloadNow…).
 */
export function useLanguageSetting() {
  const [language, setLanguage] = useState<ExtensionLanguage | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await sendMessage<ExtensionResponse>({
        type: "GET_SETTINGS",
      });
      if (res.type === "SETTINGS") setLanguage(res.settings.language);
    })();
  }, []);

  const change = useCallback(
    async (next: ExtensionLanguage): Promise<boolean> => {
      const current = await sendMessage<ExtensionResponse>({
        type: "GET_SETTINGS",
      });
      if (current.type !== "SETTINGS") return false;
      const settings: ExtensionSettings = {
        ...current.settings,
        language: next,
      };
      const res = await sendMessage<ExtensionResponse>({
        type: "SAVE_SETTINGS",
        settings,
      });
      if (res.type === "OK") {
        setLanguage(next);
        return true;
      }
      return false;
    },
    [],
  );

  return { language, change };
}
