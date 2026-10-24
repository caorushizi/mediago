import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const nsisRoot =
  process.env.MEDIAGO_NSIS_ROOT ??
  path.join(
    process.env.LOCALAPPDATA ?? "",
    "electron-builder/Cache/nsis/nsis-3.0.4.1",
  );
const plugins =
  process.env.MEDIAGO_NSIS_PLUGINS ??
  path.join(nsisRoot, "../nsis-resources-3.4.1/plugins/x86-unicode");
const compiler = path.join(nsisRoot, "makensis.exe");
const english = "A powerful and easy-to-use online video downloader";
const italian = "Un potente downloader di video online facile da usare";
const temporaryDirectories: string[] = [];

function run(executable: string, args: string[]) {
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    timeout: 30_000,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      path.basename(executable) +
        " failed (" +
        result.status +
        "): " +
        (result.error?.message ?? "") +
        "\n" +
        result.stdout +
        "\n" +
        result.stderr,
    );
  }
  return result.stdout;
}

function build(
  language: number,
  options: {
    upgrade?: boolean;
    missing?: boolean;
    consent?: boolean;
    previousConsent?: string;
    productionConsentPath?: boolean;
  } = {},
) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mediago-nsis-"));
  temporaryDirectories.push(directory);
  const executable = path.join(directory, "mediago-nsis-check.exe");
  const uninstaller = path.join(directory, "uninstall.exe");
  const consentFile = path.join(directory, "analytics-consent");
  if (options.previousConsent !== undefined)
    fs.writeFileSync(consentFile, options.previousConsent);
  const definitions = {
    PRODUCT_NAME: "MediaGo Installer QA",
    VERSION: "3.6.0-beta.0",
    APP_DESCRIPTION: english,
    OUTPUT_FILE: executable,
    UNINSTALLER_FILE: uninstaller,
    TEST_DIRECTORY: directory,
    TEST_LANGUAGE: String(language),
    INSTALLER_INCLUDE: path.join(root, "apps/electron/installer/installer.nsh"),
    PLUGIN_DIR: plugins,
    ...(options.productionConsentPath
      ? {}
      : { MEDIAGO_ANALYTICS_TEST_FILE: consentFile }),
    ...(options.consent !== undefined
      ? { TEST_ANALYTICS_DECISION: options.consent ? "1" : "0" }
      : {}),
    ...(options.upgrade ? { TEST_UPGRADE: "" } : {}),
    ...(options.missing ? { TEST_MISSING_LINKS: "" } : {}),
  };
  const args = [
    "/WX",
    "/V2",
    ...Object.entries(definitions).map(
      ([key, value]) => "/D" + key + "=" + value,
    ),
    path.join(root, "tests/fixtures/nsis/localization.nsi"),
  ];

  if (options.productionConsentPath) {
    run(compiler, args);
    return { directory, executable, uninstaller, strings: [], consentFile };
  }

  // Exercise the silent intermediate-uninstaller generation used by electron-builder.
  run(compiler, ["/DBUILD_UNINSTALLER", ...args]);
  run(executable, ["/S"]);
  expect(fs.existsSync(uninstaller)).toBe(true);
  run(uninstaller, ["/S", "_?=" + directory]);
  expect(fs.readFileSync(path.join(directory, "uninstalled.txt"), "utf8")).toBe(
    "uninstaller completed",
  );
  fs.unlinkSync(path.join(directory, "uninstalled.txt"));

  run(compiler, args);
  run(executable, ["/S"]);
  const strings = fs
    .readFileSync(path.join(directory, "strings.txt"), "utf16le")
    .replace(/^\uFEFF/, "")
    .trimEnd()
    .split(/\r?\n/);
  return { directory, executable, uninstaller, strings, consentFile };
}

type Shortcut = {
  description: string;
  target: string;
  arguments: string;
  icon: string;
  workingDirectory: string;
  windowStyle: number;
  appId: string;
  fileDescription: string;
};

function shortcuts(directory: string): Shortcut[] {
  const escaped = directory.replaceAll("'", "''");
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "[Console]::OutputEncoding = [Text.Encoding]::UTF8",
    "$w = New-Object -ComObject WScript.Shell",
    "$s = New-Object -ComObject Shell.Application",
    "$fileDescription = (Get-Item -LiteralPath (Join-Path '" +
      escaped +
      "' 'mediago-nsis-check.exe')).VersionInfo.FileDescription",
    "@('start.lnk','desktop.lnk') | ForEach-Object {",
    "$p = Join-Path '" + escaped + "' $_",
    "$l = $w.CreateShortcut($p)",
    "$i = $s.NameSpace('" + escaped + "').ParseName($_)",
    "[pscustomobject]@{description=$l.Description;target=$l.TargetPath;arguments=$l.Arguments;icon=$l.IconLocation;workingDirectory=$l.WorkingDirectory;windowStyle=$l.WindowStyle;appId=$i.ExtendedProperty('System.AppUserModel.ID');fileDescription=$fileDescription}",
    "} | ConvertTo-Json -Compress",
  ].join("\n");
  return JSON.parse(
    run("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      script,
    ]).replace(/^\uFEFF/, ""),
  ) as Shortcut[];
}

describe.skipIf(process.platform !== "win32")("real NSIS localization", () => {
  beforeAll(() => {
    expect(
      fs.existsSync(compiler),
      "Install NSIS or set MEDIAGO_NSIS_ROOT",
    ).toBe(true);
    expect(fs.existsSync(path.join(plugins, "WinShell.dll"))).toBe(true);
  });

  test("compiles the production consent path after the upstream install-mode declaration", () => {
    const built = build(1033, { productionConsentPath: true });
    expect(fs.existsSync(built.executable)).toBe(true);
    expect(fs.existsSync(built.consentFile)).toBe(false);
  });

  afterAll(() => {
    for (const directory of temporaryDirectories) {
      const target = path.resolve(directory);
      if (
        path.dirname(target) !== path.resolve(os.tmpdir()) ||
        !path.basename(target).startsWith("mediago-nsis-")
      ) {
        throw new Error(
          "Refusing to remove an unexpected test directory: " + target,
        );
      }
      fs.rmSync(target, { recursive: true, force: true });
    }
  });

  test.each([
    {
      language: 1033,
      title: "MediaGo Installer QA 3.6.0-beta.0 Setup",
      description: english,
    },
    {
      language: 1040,
      title: "Installazione di MediaGo Installer QA 3.6.0-beta.0",
      description: italian,
    },
    {
      language: 2052,
      title: "MediaGo Installer QA 3.6.0-beta.0 安装",
      description: "功能强大、易于使用的在线视频下载器",
    },
    {
      language: 1031,
      title: "Installation von MediaGo Installer QA 3.6.0-beta.0",
      description: english,
    },
  ])(
    "localizes language $language and runs its generated uninstaller",
    ({ language, title, description }) => {
      const built = build(language);
      expect(built.strings).toEqual([
        title,
        "Copyright MediaGo Installer QA",
        description,
      ]);
      for (const shortcut of shortcuts(built.directory)) {
        expect(shortcut.description).toBe(description);
        expect(shortcut.fileDescription).toBe(english);
      }
      run(built.uninstaller, ["/S", "_?=" + built.directory]);
      expect(
        fs.readFileSync(path.join(built.directory, "uninstalled.txt"), "utf8"),
      ).toBe("uninstaller completed");
    },
    60_000,
  );

  test("silent fresh install does not grant analytics consent", () => {
    const built = build(1033);
    expect(fs.existsSync(built.consentFile)).toBe(false);
  }, 60_000);

  test.each(["0", "1"])(
    "silent upgrade preserves prior analytics choice %s",
    (previousConsent) => {
      const built = build(1033, { previousConsent });
      expect(fs.readFileSync(built.consentFile, "utf8")).toBe(previousConsent);
    },
    60_000,
  );

  test.each([false, true])(
    "persists explicit installer analytics choice %s",
    (consent) => {
      const built = build(1033, {
        consent,
        previousConsent: consent ? "0" : "1",
      });
      expect(fs.readFileSync(built.consentFile, "utf8")).toBe(
        consent ? "1" : "0",
      );
    },
    60_000,
  );

  test("upgrades descriptions while preserving existing shortcut metadata", () => {
    const built = build(1040, { upgrade: true });
    for (const shortcut of shortcuts(built.directory)) {
      expect(shortcut.description).toBe(italian);
      expect(shortcut.target.toLowerCase()).toMatch(/\\cmd\.exe$/);
      expect(shortcut.arguments).toBe("/c echo preserved");
      expect(shortcut.icon.toLowerCase()).toMatch(/shell32\.dll,\s*7$/);
      expect(shortcut.workingDirectory.toLowerCase()).toBe(
        built.directory.toLowerCase(),
      );
      expect(shortcut.windowStyle).toBe(7);
      expect(shortcut.appId).toBe("mediago.test.preserved");
    }
  }, 60_000);

  test("does not recreate shortcuts removed by the user", () => {
    const built = build(1040, { missing: true });
    expect(fs.existsSync(path.join(built.directory, "start.lnk"))).toBe(false);
    expect(fs.existsSync(path.join(built.directory, "desktop.lnk"))).toBe(
      false,
    );
  }, 60_000);
});
