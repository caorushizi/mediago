// DOWNLOAD_EVENT_NAME is used as the channel name for dispatching download events
import { http } from "@/utils";
import { useDownloadStore } from "@/store/download";

type Callback = (...args: unknown[]) => void;

let es: EventSource | null = null;

const downloadListeners = new Set<Callback>();
const configListeners = new Set<Callback>();

let pollingTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize Go Core SSE event stream.
 * Called once from App.tsx after discovering the core URL.
 */
export function initGoEvents(coreUrl: string) {
  if (es) {
    es.close();
  }

  es = new EventSource(`${coreUrl}/api/events`);

  // Task creation is broadcast from Go Core's download.Create handler.
  // Driving the sidebar badge from SSE (instead of the local `increase()`
  // call in the form/panel handlers) keeps the count correct across
  // WebContents — e.g. the source-extract overlay dialog has its own
  // Zustand instance and its local store updates never reach the main
  // window.
  es.addEventListener("download-create", (e) => {
    try {
      const payload = JSON.parse(e.data);
      const count =
        typeof payload?.count === "number" && payload.count > 0
          ? payload.count
          : 1;
      const ids: number[] = Array.isArray(payload?.ids)
        ? payload.ids.map((id: unknown) => Number(id))
        : [];
      const { increase } = useDownloadStore.getState();
      for (let i = 0; i < count; i++) increase();

      // Also fan out to download-event listeners so `useTasks` can
      // revalidate its list — otherwise tasks imported externally
      // (browser extension's HTTP mode, Docker clients) only bump
      // the sidebar badge and the list stays stale until a manual
      // refresh.
      dispatchDownload({ type: "created", data: { ids, count } });
    } catch {
      // ignore malformed payloads
    }
  });

  es.addEventListener("download-start", (e) => {
    const payload = JSON.parse(e.data);
    dispatchDownload({ type: "start", data: { id: Number(payload.id) } });
    startProgressPolling();
  });

  es.addEventListener("download-success", (e) => {
    const payload = JSON.parse(e.data);
    dispatchDownload({ type: "success", data: { id: Number(payload.id) } });
    stopProgressPollingIfIdle();
  });

  es.addEventListener("download-failed", (e) => {
    const payload = JSON.parse(e.data);
    dispatchDownload({
      type: "failed",
      data: { id: Number(payload.id), error: payload.error },
    });
    stopProgressPollingIfIdle();
  });

  es.addEventListener("download-stop", (e) => {
    const payload = JSON.parse(e.data);
    dispatchDownload({ type: "stopped", data: { id: Number(payload.id) } });
    stopProgressPollingIfIdle();
  });

  es.addEventListener("config-changed", (e) => {
    const payload = JSON.parse(e.data);
    dispatchConfig({ key: payload.key, value: payload.value });
  });

  // Check on init whether there are already active downloads
  startProgressPolling();
}

/**
 * Subscribe to download events (start/success/failed/stopped/progress).
 * Callback receives (null, eventData) to match existing consumer pattern.
 * Returns an unsubscribe function.
 */
export function onDownloadEvent(cb: Callback): () => void {
  downloadListeners.add(cb);
  return () => {
    downloadListeners.delete(cb);
  };
}

/**
 * Subscribe to config-changed events.
 * Callback receives (null, { key, value }).
 * Returns an unsubscribe function.
 */
export function onConfigChanged(cb: Callback): () => void {
  configListeners.add(cb);
  return () => {
    configListeners.delete(cb);
  };
}

function dispatchDownload(data: unknown) {
  downloadListeners.forEach((cb) => cb(null, data));
}

function dispatchConfig(data: unknown) {
  configListeners.forEach((cb) => cb(null, data));
}

// --- Progress polling (only while downloads are active) ---

function startProgressPolling() {
  if (pollingTimer) return;
  pollingTimer = setInterval(async () => {
    try {
      // Use /api/tasks which returns TaskInfo with percent/speed/isLive
      const data = await http.get("/api/tasks");
      const result = data as {
        tasks: Array<{
          id: string;
          type: string;
          percent: number;
          speed: string;
          isLive: boolean;
          status: string;
        }>;
        total: number;
      };
      const activeTasks = result.tasks.filter(
        (t) => t.percent > 0 && t.percent < 100 && t.status === "downloading",
      );
      if (activeTasks.length > 0) {
        const progress = activeTasks.map((t) => ({
          id: Number(t.id),
          type: t.type,
          percent: String(t.percent || 0),
          speed: t.speed || "",
          isLive: t.isLive || false,
          status: t.status,
        }));
        dispatchDownload({ type: "progress", data: progress });
      }
    } catch {
      // Go Core may not be ready yet
    }
  }, 1000);
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function stopProgressPollingIfIdle() {
  try {
    const data = await http.get("/api/tasks");
    const result = data as { tasks: Array<{ status: string }>; total: number };
    const hasActive = result.tasks.some((t) => t.status === "downloading");
    if (!hasActive) {
      stopPolling();
    }
  } catch {
    // ignore
  }
}
