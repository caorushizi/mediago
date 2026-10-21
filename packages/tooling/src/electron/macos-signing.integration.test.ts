import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock("node:child_process", () => ({ spawnSync: spawn }));
vi.mock("node:timers/promises", () => ({
  setTimeout: (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay)),
}));
import { verifyMacOSDistributionArtifacts } from "./macos-signing.ts";

let root: string;
function appBundle(parent: string): string {
  const app = path.join(parent, "MediaGo.app");
  const bin = path.join(app, "Contents", "Resources", "bin");
  mkdirSync(bin, { recursive: true });
  writeFileSync(path.join(bin, "tool"), "fixture");
  return app;
}

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "mediago-macos-verification-"));
  appBundle(root);
  vi.useFakeTimers();
  spawn.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  expect(path.dirname(root)).toBe(path.resolve(tmpdir()));
  rmSync(root, { recursive: true, force: true });
});

it("awaits retries for the app and mounted/extracted bundles before cleanup", async () => {
  const failures = new Map<string, number>();
  spawn.mockImplementation((command: string, args: string[]) => {
    if (command === "hdiutil" && args[0] === "attach")
      appBundle(args[args.indexOf("-mountpoint") + 1]);
    if (command === "ditto") appBundle(args[args.length - 1]);
    let stdout = "";
    if (command === "codesign" && args[0] === "--display") {
      stdout =
        "Authority=Developer ID Application: Fixture\nTeamIdentifier=TEAM123\nCodeDirectory flags=0x10000(runtime)\n";
    }
    if (command === "file") stdout = "Mach-O 64-bit executable";
    if (command === "xcrun") {
      const app = args[args.length - 1];
      const count = failures.get(app) ?? 0;
      failures.set(app, count + 1);
      if (count === 0)
        return {
          status: 68,
          stdout: "",
          stderr:
            'NSURLErrorDomain Code=-1005 "The network connection was lost."',
        };
    }
    return { status: 0, stdout, stderr: "" };
  });
  const pending = verifyMacOSDistributionArtifacts({
    releaseDirectory: root,
    artifacts: [path.join(root, "MediaGo.dmg"), path.join(root, "MediaGo.zip")],
    platform: "darwin",
  });
  await vi.runAllTimersAsync();
  await pending;
  expect([...failures.values()]).toEqual([2, 2, 2]);
  const calls = spawn.mock.calls;
  const detach = calls.findIndex(
    ([command, args]) => command === "hdiutil" && args[0] === "detach",
  );
  expect(detach).toBeGreaterThan(0);
  const mountAssessments = calls
    .slice(0, detach)
    .filter(
      ([command, args]) =>
        command === "spctl" && args[args.length - 1].includes("mounted"),
    );
  expect(mountAssessments).toHaveLength(1);
});

it("does not retry or bypass a real signature verification failure", async () => {
  spawn.mockReturnValue({
    status: 1,
    stdout: "",
    stderr: "invalid code signature",
  });
  await expect(
    verifyMacOSDistributionArtifacts({
      releaseDirectory: root,
      artifacts: ["MediaGo.dmg", "MediaGo.zip"],
      platform: "darwin",
    }),
  ).rejects.toThrow("invalid code signature");
  expect(spawn).toHaveBeenCalledTimes(1);
});
