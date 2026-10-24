import { readFileSync } from "node:fs";
import {
  DownloadStatus,
  type DownloadEvent,
  type DownloadFailedEvent,
  type DownloadProgress,
} from "@mediago/common";
import { describe, expect, test, vi } from "vitest";
import {
  applyProgressToTaskCache,
  registerDownloadEventSubscription,
  type DownloadEventSubscriber,
} from "./use-download-events";

test("merges a live progress signal into an already-downloading task", () => {
  const current = {
    total: 1,
    list: [
      {
        id: 42,
        type: "m3u8" as const,
        name: "Live stream",
        url: "https://example.com/live.m3u8",
        status: DownloadStatus.Downloading,
        isLive: false,
      },
    ],
  };

  const result = applyProgressToTaskCache(current, [
    {
      id: 42,
      type: "m3u8",
      percent: "12",
      speed: "1 MB/s",
      isLive: true,
      status: DownloadStatus.Downloading,
    },
  ]);

  expect(result?.list[0]).toMatchObject({
    status: DownloadStatus.Downloading,
    isLive: true,
  });
});

describe("registerDownloadEventSubscription", () => {
  test("reports a missing dependency and revalidates without a HomePage subscriber", () => {
    let listener: ((event: null, data: DownloadEvent) => void) | undefined;
    const unsubscribe = vi.fn();
    const subscribe = vi.fn((callback) => {
      listener = callback;
      return unsubscribe;
    }) as DownloadEventSubscriber;
    const translate = vi.fn(
      (_key: string, options?: { dependency?: string }) =>
        `Missing ${options?.dependency}`,
    );
    const notify = vi.fn();
    const revalidateTasks = vi.fn();
    const updateProgress = vi.fn();
    const protocolWarning = vi.fn();

    const cleanup = registerDownloadEventSubscription(subscribe, {
      translate,
      notify,
      revalidateTasks,
      updateProgress,
      protocolWarning,
    });
    listener?.(null, {
      type: "failed",
      data: {
        id: 42,
        error: "server detail",
        errorCode: "dependency_missing",
        dependency: "BBDown",
      },
    } satisfies DownloadFailedEvent);

    expect(subscribe).toHaveBeenCalledOnce();
    expect(translate).toHaveBeenCalledExactlyOnceWith("dependencyMissing", {
      dependency: "BBDown",
    });
    expect(notify).toHaveBeenCalledExactlyOnceWith("Missing BBDown");
    expect(revalidateTasks).toHaveBeenCalledOnce();
    expect(updateProgress).not.toHaveBeenCalled();
    expect(protocolWarning).not.toHaveBeenCalled();
    expect(cleanup).toBe(unsubscribe);
    cleanup();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  test.each(["success", "stopped", "created"])(
    "revalidates task caches once for a %s event",
    (type) => {
      let listener: ((event: null, data: DownloadEvent) => void) | undefined;
      const subscribe = vi.fn((callback) => {
        listener = callback;
        return vi.fn();
      }) as DownloadEventSubscriber;
      const revalidateTasks = vi.fn();

      registerDownloadEventSubscription(subscribe, {
        translate: vi.fn(() => "translated"),
        notify: vi.fn(),
        revalidateTasks,
        updateProgress: vi.fn(),
        protocolWarning: vi.fn(),
      });
      listener?.(null, { type, data: {} });

      expect(revalidateTasks).toHaveBeenCalledOnce();
    },
  );

  test("updates progress caches without network revalidation", () => {
    let listener: ((event: null, data: DownloadEvent) => void) | undefined;
    const subscribe = vi.fn((callback) => {
      listener = callback;
      return vi.fn();
    }) as DownloadEventSubscriber;
    const progress: DownloadProgress[] = [
      {
        id: 42,
        type: "bilibili",
        percent: "50",
        speed: "1 MB/s",
        isLive: false,
        status: DownloadStatus.Downloading,
      },
    ];
    const revalidateTasks = vi.fn();
    const updateProgress = vi.fn();

    registerDownloadEventSubscription(subscribe, {
      translate: vi.fn(() => "translated"),
      notify: vi.fn(),
      revalidateTasks,
      updateProgress,
      protocolWarning: vi.fn(),
    });
    listener?.(null, { type: "progress", data: progress });

    expect(updateProgress).toHaveBeenCalledExactlyOnceWith(progress);
    expect(revalidateTasks).not.toHaveBeenCalled();
  });
});

test("App owns the only UI download-event subscription", () => {
  const appSource = readFileSync(
    new URL("../App.tsx", import.meta.url),
    "utf8",
  );
  const useTasksSource = readFileSync(
    new URL("./use-tasks.ts", import.meta.url),
    "utf8",
  );

  expect(appSource.match(/useDownloadEvents\(\)/g)).toHaveLength(1);
  expect(useTasksSource).not.toContain("onDownloadEvent");
  expect(useTasksSource).not.toContain("handleDownloadFailure");
  expect(useTasksSource).not.toContain("components/ui/toast");
});
