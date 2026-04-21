import { useCallback, useEffect, useState } from "react";

import { DEFAULT_SETTINGS } from "@/shared/constants";
import type {
  ExtensionMessage,
  ExtensionResponse,
  ExtensionSettings,
  InvocationMode,
  LocalizedMessage,
  ServerStatus,
} from "@/shared/types";

async function sendMessage<T extends ExtensionResponse>(
  msg: ExtensionMessage,
): Promise<T> {
  return (await chrome.runtime.sendMessage(msg)) as T;
}

export function useOptions() {
  const [mode, setMode] = useState<InvocationMode>("desktop-http");
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastStatus, setLastStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await sendMessage<ExtensionResponse>({
        type: "GET_SETTINGS",
      });
      if (res.type === "SETTINGS") {
        setMode(res.settings.mode);
        setServerUrl(res.settings.serverUrl);
        setApiKey(res.settings.apiKey);
      }
      setLoaded(true);
    })();
  }, []);

  const normalizedUrl = useCallback(
    () => serverUrl.trim().replace(/\/+$/, ""),
    [serverUrl],
  );

  const test = useCallback(async () => {
    // Docker mode requires a URL; the other two are fine without.
    if (mode === "docker-http" && !normalizedUrl()) {
      setLastStatus({
        ok: false,
        message: { key: "errors.serverUrlRequired" },
      });
      return;
    }
    setTesting(true);
    try {
      const res = await sendMessage<ExtensionResponse>({
        type: "TEST_CONNECTION",
        mode,
        serverUrl: normalizedUrl(),
        apiKey: apiKey.trim(),
      });
      if (res.type === "STATUS") setLastStatus(res.status);
    } finally {
      setTesting(false);
    }
  }, [apiKey, mode, normalizedUrl]);

  const save = useCallback(async (): Promise<
    { ok: true } | { ok: false; error: LocalizedMessage }
  > => {
    // Mode-specific validation — we never silently downgrade, so we
    // reject invalid combinations instead of rescuing them.
    if (mode === "docker-http" && !normalizedUrl()) {
      return { ok: false, error: { key: "errors.dockerServerRequired" } };
    }
    setSaving(true);
    try {
      // Re-fetch the current persisted settings so we merge on top
      // instead of wiping fields this card doesn't own (downloadNow,
      // schemaSilent, language — managed by other cards).
      const current = await sendMessage<ExtensionResponse>({
        type: "GET_SETTINGS",
      });
      const base: ExtensionSettings =
        current.type === "SETTINGS" ? current.settings : DEFAULT_SETTINGS;
      const settings: ExtensionSettings = {
        ...base,
        mode,
        serverUrl: mode === "docker-http" ? normalizedUrl() : "",
        apiKey: mode === "docker-http" ? apiKey.trim() : "",
      };
      const res = await sendMessage<ExtensionResponse>({
        type: "SAVE_SETTINGS",
        settings,
      });
      if (res.type === "OK") return { ok: true };
      return { ok: false, error: { key: "common.saveFailed" } };
    } finally {
      setSaving(false);
    }
  }, [apiKey, mode, normalizedUrl]);

  return {
    mode,
    setMode,
    serverUrl,
    apiKey,
    setServerUrl,
    setApiKey,
    loaded,
    testing,
    saving,
    lastStatus,
    test,
    save,
  };
}
