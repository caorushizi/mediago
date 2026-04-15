import { useCallback, useEffect, useState } from "react";

import type {
  ExtensionMessage,
  ExtensionResponse,
  ExtensionSettings,
  InvocationMode,
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
      setLastStatus({ ok: false, message: "请先填写服务器 URL" });
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
    { ok: true } | { ok: false; error: string }
  > => {
    // Mode-specific validation — we never silently downgrade, so we
    // reject invalid combinations instead of rescuing them.
    if (mode === "docker-http" && !normalizedUrl()) {
      return { ok: false, error: "Docker 模式必须填写服务器 URL" };
    }
    setSaving(true);
    try {
      // Re-fetch the current persisted settings so we merge on top
      // instead of wiping fields this card doesn't own (downloadNow,
      // schemaSilent — managed by ImportBehaviourCard).
      const current = await sendMessage<ExtensionResponse>({
        type: "GET_SETTINGS",
      });
      const base: ExtensionSettings =
        current.type === "SETTINGS"
          ? current.settings
          : {
              mode: "desktop-http",
              serverUrl: "",
              apiKey: "",
              downloadNow: false,
              schemaSilent: true,
            };
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
      return { ok: false, error: "保存失败" };
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
