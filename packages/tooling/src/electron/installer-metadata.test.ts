import { afterEach, describe, expect, test, vi } from "vitest";
import {
  configureInstallerMetadata,
  getApplicationCopyright,
} from "./installer-metadata.ts";

afterEach(() => vi.useRealTimers());

describe("application copyright", () => {
  test("uses the project's first commit year and the current build year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
    expect(getApplicationCopyright("caorushizi")).toBe("2021-2026 caorushizi");
    vi.setSystemTime(new Date("2027-01-02T12:00:00Z"));
    expect(getApplicationCopyright("caorushizi")).toBe("2021-2027 caorushizi");
  });

  test("preserves the builder default when no owner is configured", () => {
    expect(getApplicationCopyright(undefined)).toBeUndefined();
  });
});

function nsisCommands() {
  return {
    VIAddVersionKey: [
      '/LANG=1033 ProductName "mediago-community"',
      '/LANG=1033 ProductVersion "3.6.0-beta.1"',
      '/LANG=1033 LegalCopyright "2021-2026 caorushizi"',
      '/LANG=1033 FileDescription "A powerful and easy-to-use online video downloader"',
      '/LANG=1033 FileVersion "3.6.0-beta.1"',
    ],
    OutFile: '"mediago-setup.exe"',
  };
}

describe("NSIS installer metadata", () => {
  const productName = String.raw`MediaGo $$ $\"installer$\"`;
  test("changes only the setup file description and continues packaging", async () => {
    const compiled = nsisCommands();
    const original = structuredClone(compiled);
    const defines = {
      UNINSTALL_DISPLAY_NAME: "mediago-community",
      APP_DESCRIPTION: "Existing shortcut description",
    };
    expect(await configureInstallerMetadata([defines, compiled])).toBe(false);
    expect(compiled.VIAddVersionKey[3]).toBe(
      '/LANG=1033 FileDescription "mediago-community installer"',
    );
    const expected = structuredClone(original);
    expected.VIAddVersionKey[3] = compiled.VIAddVersionKey[3];
    expect(compiled).toEqual(expected);
    expect(defines.APP_DESCRIPTION).toBe("Existing shortcut description");
  });

  test("keeps portable descriptions unchanged", async () => {
    const compiled = nsisCommands();
    const original = structuredClone(compiled);
    expect(
      await configureInstallerMetadata([
        { REQUEST_EXECUTION_LEVEL: "user" },
        compiled,
      ]),
    ).toBe(false);
    expect(compiled).toEqual(original);
  });

  test("ignores other target callback shapes", async () => {
    expect(
      await configureInstallerMetadata({ volumePath: "/Volumes/MediaGo" }),
    ).toBe(false);
  });

  test("preserves locale-specific names and existing NSIS escaping", async () => {
    const compiled = {
      VIAddVersionKey: [
        '/LANG=1040 ProductName "' + productName + '"',
        '/LANG=1040 FileDescription "Old description"',
      ],
    };
    await configureInstallerMetadata([
      { UNINSTALL_DISPLAY_NAME: "MediaGo" },
      compiled,
    ]);
    expect(compiled.VIAddVersionKey[1]).toBe(
      '/LANG=1040 FileDescription "' + productName + ' installer"',
    );
  });

  test.each([
    {},
    { VIAddVersionKey: [null] },
    { VIAddVersionKey: ['/LANG=1033 ProductName "MediaGo"'] },
    { VIAddVersionKey: ['/LANG=1033 FileDescription "Old description"'] },
  ])(
    "fails before compilation if required installer metadata is missing: %j",
    async (compiled) => {
      await expect(
        configureInstallerMetadata([
          { UNINSTALL_DISPLAY_NAME: "MediaGo" },
          compiled,
        ]),
      ).rejects.toThrow(/NSIS installer/);
    },
  );
});
