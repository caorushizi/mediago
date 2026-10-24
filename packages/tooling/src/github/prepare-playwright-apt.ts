import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
export const APT_NETWORK_CONFIG = [
  'Acquire::Retries "2";',
  'Acquire::http::Timeout "30";',
  'Acquire::https::Timeout "30";',
  "",
].join("\n");

type WriteRootFile = (file: string, contents: string) => void;

export function replaceAzureUbuntuMirror(contents: string): string {
  return contents.replace(
    /https?:\/\/azure\.archive\.ubuntu\.com(?=\/|\s|$)/g,
    "https://archive.ubuntu.com",
  );
}

function writeRootFile(file: string, contents: string): void {
  execFileSync("sudo", ["-n", "tee", "--", file], {
    input: contents,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
}

export function preparePlaywrightApt(
  aptRoot = "/etc/apt",
  write: WriteRootFile = writeRootFile,
): void {
  const sourceParts = join(aptRoot, "sources.list.d");
  // Hosted runner sources can point at mirror+file instead of an HTTP URL.
  const sources = [
    join(aptRoot, "apt-mirrors.txt"),
    join(aptRoot, "sources.list"),
    ...(existsSync(sourceParts)
      ? readdirSync(sourceParts)
          .filter((name) => /\.(list|sources)$/.test(name))
          .map((name) => join(sourceParts, name))
      : []),
  ];

  for (const source of sources) {
    if (!existsSync(source)) continue;
    const original = readFileSync(source, "utf8");
    const updated = replaceAzureUbuntuMirror(original);
    if (updated !== original) write(source, updated);
  }

  write(join(aptRoot, "apt.conf.d", "80mediago-network"), APT_NETWORK_CONFIG);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === SCRIPT_FILE) {
  if (process.platform === "linux" && process.env.GITHUB_ACTIONS === "true") {
    try {
      preparePlaywrightApt();
      process.stdout.write(
        "Playwright APT: Ubuntu HTTPS mirror, 30s network timeout, 2 retries.\n",
      );
    } catch (error) {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    }
  } else {
    process.stdout.write(
      "Playwright APT overrides apply only to Linux GitHub Actions runners.\n",
    );
  }
}
