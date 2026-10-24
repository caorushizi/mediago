import { describe, expect, test, vi } from "vitest";
import {
  createAnalyticsConsent,
  normalizeAnalyticsConsent,
  type AnalyticsConsentDependencies,
} from "./analytics-consent";

function fixture(overrides: Partial<AnalyticsConsentDependencies> = {}) {
  let receive: ((value: unknown) => void) | undefined;
  const deps = {
    read: vi.fn(async () => ({ enabled: false, decided: false })),
    write: vi.fn(async (enabled: boolean) => ({ enabled, decided: true })),
    listen: vi.fn((listener: (value: unknown) => void) => {
      receive = listener;
    }),
    enable: vi.fn(),
    disable: vi.fn(),
    hasLoadedSDK: () => true,
    reload: vi.fn(),
    ...overrides,
  };
  return {
    deps,
    consent: createAnalyticsConsent(deps),
    receive: (value: unknown) => receive?.(value),
  };
}

describe("analytics startup and revocation", () => {
  test("does not load SDK before persisted explicit consent is known", async () => {
    const { consent, deps } = fixture();
    expect(consent.getSnapshot().enabled).toBe(false);
    await consent.initialize();
    await consent.initialize();
    expect(deps.listen).toHaveBeenCalledTimes(1);
    expect(deps.enable).not.toHaveBeenCalled();
    expect(consent.getSnapshot()).toMatchObject({
      enabled: false,
      decided: false,
      loaded: true,
    });
  });
  test("missing or failed persistence stays disabled; explicit allow enables once", async () => {
    const { consent, deps } = fixture({
      read: vi.fn(async () => {
        throw new Error("unavailable");
      }),
    });
    await consent.initialize();
    expect(deps.enable).not.toHaveBeenCalled();
    await consent.choose(true);
    expect(deps.enable).toHaveBeenCalledOnce();
    expect(consent.getSnapshot()).toMatchObject({
      enabled: true,
      decided: true,
      saving: false,
    });
  });
  test("refusal never enables SDK; revocation persists before document reload", async () => {
    const { consent, deps } = fixture();
    await consent.initialize();
    await consent.choose(false);
    expect(deps.enable).not.toHaveBeenCalled();
    expect(deps.reload).not.toHaveBeenCalled();
    await consent.choose(true);
    deps.reload.mockImplementation(() =>
      expect(deps.write).toHaveBeenLastCalledWith(false),
    );
    await consent.choose(false);
    expect(deps.reload).toHaveBeenCalledOnce();
    expect(consent.getSnapshot().enabled).toBe(false);
  });
  test("another window/tab revokes consent and destroys its running SDK", async () => {
    const { consent, deps, receive } = fixture({
      read: vi.fn(async () => ({ enabled: true, decided: true })),
    });
    await consent.initialize();
    receive({ enabled: false, decided: true });
    expect(deps.disable).toHaveBeenCalled();
    expect(deps.reload).toHaveBeenCalledOnce();
  });
  test("slow startup read cannot overwrite a newer refusal", async () => {
    let finish!: (value: unknown) => void;
    const { consent, receive } = fixture({
      read: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    });
    const initializing = consent.initialize();
    receive({ enabled: false, decided: true });
    finish({ enabled: true, decided: true });
    await initializing;
    expect(consent.getSnapshot()).toMatchObject({
      enabled: false,
      decided: true,
    });
  });
  test("write failure remains visible and cannot enable statistics", async () => {
    const { consent, deps } = fixture({
      write: async () => {
        throw new Error("disk full");
      },
    });
    await consent.initialize();
    await expect(consent.choose(true)).rejects.toThrow("disk full");
    expect(consent.getSnapshot()).toMatchObject({
      enabled: false,
      saving: false,
    });
    expect(deps.enable).not.toHaveBeenCalled();
  });
  test("malformed IPC response cannot grant consent", () => {
    for (const value of [
      true,
      { enabled: "true", decided: true },
      { enabled: true },
      { code: 1, msg: "failed" },
    ]) {
      expect(normalizeAnalyticsConsent(value)).toEqual({
        enabled: false,
        decided: false,
      });
    }
    expect(
      normalizeAnalyticsConsent({
        code: 0,
        data: { enabled: true, decided: true },
      }),
    ).toEqual({ enabled: true, decided: true });
  });
});
