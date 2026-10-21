import { parse } from "yaml";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { validateMacOSRecovery } from "./release-recovery.ts";

type Input = Parameters<typeof validateMacOSRecovery>[0];
const source = "a".repeat(40);
const parent = "b".repeat(40);
const prefix = "mediago-release-3.6.0-beta.1-" + source.slice(0, 12) + "-100-1";

function fixture(): Input {
  return {
    runId: "100",
    sourceSha: source,
    sourceParent: parent,
    ownerRunId: "100",
    ownerTarget: "all",
    version: "3.6.0-beta.1",
    releaseFiles: ["apps/electron/app/package.json"],
    toolingChanges: [
      "packages/tooling/src/electron/macos-network-retry.ts",
      ".github/workflows/recover-release.yml",
    ],
    run: {
      id: 100,
      path: ".github/workflows/release.yml",
      head_sha: parent,
      status: "completed",
      conclusion: "failure",
    },
    jobs: [
      ...["windows-latest", "ubuntu-latest", "macos-15"].map((runner) => ({
        name: "Desktop builds / Build official desktop (" + runner + ")",
        conclusion: "success",
      })),
      {
        name: "Docker build / Build and push multi-arch image",
        conclusion: "success",
      },
    ],
    artifacts: ["windows-latest", "ubuntu-latest", "macos-15"].map(
      (runner) => ({
        name: prefix + "-" + runner,
        expired: false,
        size_in_bytes: 10,
      }),
    ),
    published: false,
  };
}

describe("existing beta recovery provenance", () => {
  it("keeps the original beta version and artifact identity", () => {
    expect(validateMacOSRecovery(fixture())).toBe(prefix);
  });
  it.each([
    (v: Input) => {
      v.toolingChanges.push("apps/ui/src/App.tsx");
    },
    (v: Input) => {
      v.toolingChanges.push("packages/tooling/src/runtime-deps/provisioner.ts");
    },
    (v: Input) => {
      v.ownerRunId = "101";
    },
    (v: Input) => {
      v.ownerTarget = "desktop";
    },
    (v: Input) => {
      v.sourceParent = "c".repeat(40);
    },
    (v: Input) => {
      v.releaseFiles.push("apps/core/main.go");
    },
    (v: Input) => {
      v.run.status = "in_progress";
    },
    (v: Input) => {
      v.run.path = ".github/workflows/untrusted.yml";
    },
    (v: Input) => {
      v.published = true;
    },
    (v: Input) => {
      v.artifacts[0].expired = true;
    },
    (v: Input) => {
      v.artifacts.pop();
    },
    (v: Input) => {
      v.artifacts.push(v.artifacts[0]);
    },
    (v: Input) => {
      v.artifacts[0].name = v.artifacts[0].name.replace("-100-1-", "-100-2-");
    },
    (v: Input) => {
      v.jobs[0].conclusion = "failure";
    },
    (v: Input) => {
      v.jobs.pop();
    },
    (v: Input) => {
      v.version = "3.6.0-test.1";
    },
  ])("rejects invalid source, publication or artifact state %#", (mutate) => {
    const input = fixture();
    mutate(input);
    expect(() => validateMacOSRecovery(input)).toThrow();
  });
});

const temporaryRoots: string[] = [];
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    expect(path.dirname(root)).toBe(path.resolve(tmpdir()));
    rmSync(root, { recursive: true, force: true });
  }
});

it("applies the retry tooling to the original product commit in a real git checkout", () => {
  const root = mkdtempSync(path.join(tmpdir(), "mediago-recovery-test-"));
  temporaryRoots.push(root);
  const git = (args: string[]) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  const write = (name: string, value: string) => {
    const file = path.join(root, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, value);
  };
  git(["init"]);
  git(["config", "user.name", "MediaGo recovery test"]);
  git(["config", "user.email", "test@example.invalid"]);
  write("apps/core/main.go", "original product");
  write("apps/electron/app/package.json", '{"version":"3.6.0-beta.1"}');
  write("packages/tooling/src/electron/macos-signing.ts", "original tooling");
  git(["add", "."]);
  git(["commit", "-m", "original release"]);
  const original = git(["rev-parse", "HEAD"]);
  write(
    "packages/tooling/src/electron/macos-signing.ts",
    "reviewed retry tooling",
  );
  write(
    "packages/tooling/src/electron/macos-network-retry.ts",
    "bounded retry helper",
  );
  git(["add", "."]);
  git(["commit", "-m", "repair build tooling"]);
  const tooling = git(["rev-parse", "HEAD"]);
  const script = fileURLToPath(
    new URL("./release-recovery.ts", import.meta.url),
  );
  execFileSync(process.execPath, [script, "apply-tooling"], {
    cwd: root,
    env: { ...process.env, SOURCE_SHA: original, TOOLING_SHA: tooling },
    stdio: "pipe",
  });
  expect(git(["rev-parse", "HEAD"])).toBe(original);
  expect(readFileSync(path.join(root, "apps/core/main.go"), "utf8")).toBe(
    "original product",
  );
  expect(
    JSON.parse(
      readFileSync(path.join(root, "apps/electron/app/package.json"), "utf8"),
    ).version,
  ).toBe("3.6.0-beta.1");
  expect(
    readFileSync(
      path.join(root, "packages/tooling/src/electron/macos-signing.ts"),
      "utf8",
    ),
  ).toBe("reviewed retry tooling");
  expect(
    readFileSync(
      path.join(root, "packages/tooling/src/electron/macos-network-retry.ts"),
      "utf8",
    ),
  ).toBe("bounded retry helper");
});

it("gates publication on Intel validation and reuses original artifacts without a version bump", () => {
  const workflow = parse(
    readFileSync(
      fileURLToPath(
        new URL(
          "../../../../.github/workflows/recover-release.yml",
          import.meta.url,
        ),
      ),
      "utf8",
    ),
  ) as {
    jobs: Record<
      string,
      {
        needs?: string[];
        permissions: Record<string, string>;
        steps: {
          run?: string;
          uses?: string;
          with?: Record<string, unknown>;
        }[];
      }
    >;
  };
  expect(workflow.jobs.publish.needs).toEqual(["prepare", "intel"]);
  expect(workflow.jobs.intel.permissions).toEqual({ contents: "read" });
  const runSteps = Object.values(workflow.jobs)
    .flatMap((job) => job.steps)
    .filter((step) => step.run);
  expect(
    runSteps.every((step) => /^task ci:(?:release|desktop):/.test(step.run!)),
  ).toBe(true);
  expect(
    runSteps.some((step) => /calculate-version|commit-version/.test(step.run!)),
  ).toBe(false);
  const downloads = workflow.jobs.publish.steps.filter((step) =>
    step.uses?.startsWith("actions/download-artifact@"),
  );
  expect(downloads).toHaveLength(2);
  expect(downloads[0].with?.["run-id"]).toBeDefined();
  expect(downloads[1].with?.["run-id"]).toBeUndefined();
});
