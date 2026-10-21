import { describe, expect, it, vi } from "vitest";
import {
  isAppleNetworkError,
  withAppleNetworkRetry,
} from "./macos-network-retry.ts";

const networkFailure = () =>
  new Error(
    'xcrun stapler validate failed with status 68: Error Domain=NSURLErrorDomain Code=-1005 "The network connection was lost."',
  );

describe("Apple network retries", () => {
  it("recovers transient stapling failures with exponential backoff", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          "Failed to staple your application: " + networkFailure().message,
        ),
      )
      .mockRejectedValueOnce(networkFailure())
      .mockResolvedValue("verified");
    const sleep = vi.fn().mockResolvedValue(undefined);
    const report = vi.fn();
    await expect(
      withAppleNetworkRetry(operation, { label: "stapler", sleep, report }),
    ).resolves.toBe("verified");
    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[15000], [30000]]);
    expect(report.mock.calls.flat().join("")).not.toContain(
      networkFailure().message,
    );
  });

  it("stops after five attempts and preserves the final error", async () => {
    const failure = networkFailure();
    const operation = vi.fn().mockRejectedValue(failure);
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      withAppleNetworkRetry(operation, {
        label: "stapler",
        sleep,
        report: () => {},
      }),
    ).rejects.toBe(failure);
    expect(operation).toHaveBeenCalledTimes(5);
    expect(sleep.mock.calls).toEqual([[15000], [30000], [60000], [120000]]);
  });

  it.each([
    "xcrun stapler validate failed with status 68",
    "xcrun stapler validate: ticket revoked",
    "codesign: invalid code signature",
    'notarytool: {"status":"Invalid"}',
    "notarytool: HTTP 401",
    "notarytool: HTTP 403",
    "Vite build failed with ECONNRESET",
    "notarytool: invalid code signature; " + networkFailure().message,
  ])(
    "fails immediately for permanent or unrelated errors: %s",
    async (message) => {
      const failure = new Error(message);
      const operation = vi.fn().mockRejectedValue(failure);
      const sleep = vi.fn();
      await expect(
        withAppleNetworkRetry(operation, { label: "stapler", sleep }),
      ).rejects.toBe(failure);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    },
  );

  it.each([-1001, -1003, -1004, -1005, -1006, -1009])(
    "recognizes Apple URL network error %s",
    (code) => {
      expect(
        isAppleNetworkError(
          new Error("stapler: Error Domain=NSURLErrorDomain Code=" + code),
        ),
      ).toBe(true);
    },
  );

  it("supports a smaller packaging retry budget", async () => {
    const operation = vi.fn().mockRejectedValue(networkFailure());
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      withAppleNetworkRetry(operation, {
        label: "packaging",
        attempts: 3,
        sleep,
        report: () => {},
      }),
    ).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
