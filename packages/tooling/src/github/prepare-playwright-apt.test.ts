import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, expect, test, vi } from "vitest";
import {
  APT_NETWORK_CONFIG,
  preparePlaywrightApt,
  replaceAzureUbuntuMirror,
} from "./prepare-playwright-apt.ts";

const fixtures: string[] = [];
afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

function createAptFixture(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "mediago-playwright-apt-"));
  fixtures.push(root);
  mkdirSync(join(root, "apt.conf.d"));
  for (const [file, contents] of Object.entries(files)) {
    const destination = join(root, file);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, contents);
  }
  return root;
}

const write = (file: string, contents: string) => writeFileSync(file, contents);

test("fixes the runner mirror list actually selected by mirror+file sources", () => {
  const root = createAptFixture({
    "apt-mirrors.txt":
      "http://azure.archive.ubuntu.com/ubuntu/\tpriority:1\n" +
      "https://archive.ubuntu.com/ubuntu/\tpriority:2\n" +
      "https://security.ubuntu.com/ubuntu/\tpriority:3\n",
    "sources.list.d/ubuntu.sources":
      "Types: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\n" +
      "Suites: noble noble-updates noble-security\nComponents: main universe\n" +
      "Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n",
  });
  const originalSources = readFileSync(
    join(root, "sources.list.d/ubuntu.sources"),
    "utf8",
  );
  preparePlaywrightApt(root, write);
  expect(readFileSync(join(root, "apt-mirrors.txt"), "utf8")).toBe(
    "https://archive.ubuntu.com/ubuntu/\tpriority:1\n" +
      "https://archive.ubuntu.com/ubuntu/\tpriority:2\n" +
      "https://security.ubuntu.com/ubuntu/\tpriority:3\n",
  );
  expect(
    readFileSync(join(root, "sources.list.d/ubuntu.sources"), "utf8"),
  ).toBe(originalSources);
});

test("preserves suites, components and signing keys in legacy and deb822 sources", () => {
  const root = createAptFixture({
    "sources.list":
      "deb http://azure.archive.ubuntu.com/ubuntu noble main universe\n",
    "sources.list.d/ubuntu.sources":
      "Types: deb\nURIs: https://azure.archive.ubuntu.com/ubuntu\n" +
      "Suites: noble-updates noble-security\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n",
    "sources.list.d/vendor.list":
      "deb https://packages.microsoft.com/ubuntu/24.04/prod noble main\n",
    "sources.list.d/ubuntu.sources.backup":
      "http://azure.archive.ubuntu.com/ubuntu\n",
  });
  preparePlaywrightApt(root, write);
  expect(readFileSync(join(root, "sources.list"), "utf8")).toBe(
    "deb https://archive.ubuntu.com/ubuntu noble main universe\n",
  );
  expect(
    readFileSync(join(root, "sources.list.d/ubuntu.sources"), "utf8"),
  ).toBe(
    "Types: deb\nURIs: https://archive.ubuntu.com/ubuntu\n" +
      "Suites: noble-updates noble-security\nSigned-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n",
  );
  expect(readFileSync(join(root, "sources.list.d/vendor.list"), "utf8")).toBe(
    "deb https://packages.microsoft.com/ubuntu/24.04/prod noble main\n",
  );
  expect(
    readFileSync(join(root, "sources.list.d/ubuntu.sources.backup"), "utf8"),
  ).toContain("azure.archive.ubuntu.com");
});

test("does not rewrite lookalike hosts or unrelated repositories", () => {
  const source =
    "https://azureXarchiveXubuntuXcom/ubuntu\n" +
    "https://azure.archive.ubuntu.com.example/ubuntu\n" +
    "https://security.ubuntu.com/ubuntu\n";
  expect(replaceAzureUbuntuMirror(source)).toBe(source);
});

test("adds bounded APT network options even when no mirror override is needed", () => {
  const root = createAptFixture({});
  preparePlaywrightApt(root, write);
  expect(readFileSync(join(root, "apt.conf.d/80mediago-network"), "utf8")).toBe(
    'Acquire::Retries "2";\nAcquire::http::Timeout "30";\nAcquire::https::Timeout "30";\n',
  );
});

test("does not rewrite already configured sources on repeated preparation", () => {
  const root = createAptFixture({
    "sources.list": "deb https://archive.ubuntu.com/ubuntu noble main\n",
  });
  preparePlaywrightApt(root, write);
  const writes = vi.fn(write);
  preparePlaywrightApt(root, writes);
  expect(writes).toHaveBeenCalledExactlyOnceWith(
    join(root, "apt.conf.d/80mediago-network"),
    APT_NETWORK_CONFIG,
  );
});

test("propagates a failed privileged configuration write instead of skipping installation checks", () => {
  const root = createAptFixture({
    "sources.list": "deb http://azure.archive.ubuntu.com/ubuntu noble main\n",
  });
  expect(() =>
    preparePlaywrightApt(root, () => {
      throw new Error("sudo denied");
    }),
  ).toThrow("sudo denied");
});
