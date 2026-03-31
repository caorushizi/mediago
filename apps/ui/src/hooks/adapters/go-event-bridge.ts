import { MediaGoClient, TaskStatus } from "@mediago/core-sdk";
import {
  DOWNLOAD_EVENT_NAME,
  type DownloadProgress,
  type DownloadStatus,
} from "@mediago/shared-common";
import type { IpcListener } from "./utils";

type Callback = (...args: unknown[]) => void;

export function createGoEventBridge(
  coreUrl: string,
  apiKey?: string,
): IpcListener & { close: () => void } {
  const client = new MediaGoClient({ baseURL: coreUrl, apiKey });
  const listenersMap = new Map<string, Set<Callback>>();

  // --- SSE subscription ---
  const events = client.streamEvents();

  events.on("download-start", (payload) => {
    dispatch(DOWNLOAD_EVENT_NAME, {
      type: "start",
      data: { id: Number(payload.id) },
    });
    startPolling();
  });

  events.on("download-success", (payload) => {
    dispatch(DOWNLOAD_EVENT_NAME, {
      type: "success",
      data: { id: Number(payload.id) },
    });
    stopPollingIfIdle();
  });

  events.on("download-failed", (payload) => {
    dispatch(DOWNLOAD_EVENT_NAME, {
      type: "failed",
      data: { id: Number(payload.id), error: payload.error },
    });
    stopPollingIfIdle();
  });

  events.on("download-stop", (payload) => {
    dispatch(DOWNLOAD_EVENT_NAME, {
      type: "stopped",
      data: { id: Number(payload.id) },
    });
    stopPollingIfIdle();
  });

  events.on("config-changed", (payload) => {
    dispatch("config-changed", { key: payload.key, value: payload.value });
  });

  // --- Progress polling (only while downloads are active) ---
  let pollingTimer: ReturnType<typeof setInterval> | null = null;

  function startPolling() {
    if (pollingTimer) return;
    pollingTimer = setInterval(async () => {
      try {
        const { data } = await client.listTasks();
        const tasks: DownloadProgress[] = data.tasks
          .filter(
            (t) =>
              t.percent &&
              t.percent > 0 &&
              t.percent < 100 &&
              t.status === TaskStatus.Downloading,
          )
          .map((t) => ({
            id: Number(t.id),
            type: t.type,
            percent: String(t.percent || 0),
            speed: t.speed || "",
            isLive: t.isLive || false,
            status: t.status as unknown as DownloadStatus,
          }));
        if (tasks.length > 0) {
          dispatch(DOWNLOAD_EVENT_NAME, { type: "progress", data: tasks });
        }
      } catch {
        // Go Core may not be ready yet, silently ignore
      }
    }, 1000);
  }

  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }

  async function stopPollingIfIdle() {
    try {
      const { data } = await client.listTasks();
      const hasActive = data.tasks.some(
        (t) => t.status === TaskStatus.Downloading,
      );
      if (!hasActive) {
        stopPolling();
      }
    } catch {
      // ignore
    }
  }

  function dispatch(channel: string, data: unknown) {
    const set = listenersMap.get(channel);
    if (set) {
      set.forEach((fn) => fn(null, data));
    }
  }

  return {
    addIpcListener(channel: string, fn: Callback) {
      if (!listenersMap.has(channel)) {
        listenersMap.set(channel, new Set());
      }
      listenersMap.get(channel)!.add(fn);
    },
    removeIpcListener(channel: string, fn: Callback) {
      listenersMap.get(channel)?.delete(fn);
    },
    close() {
      events.close();
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
      listenersMap.clear();
    },
  };
}
