import { createServer, type ServerResponse } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import {
  _electron,
  expect,
  test,
  type ElectronApplication,
} from "@playwright/test";
import { waitForElectronMainWindow } from "../support/electron-window.ts";
import { scrubElectronEnvironment } from "../support/electron-network.ts";
import {
  closeElectron,
  readProcessIdentity,
  type ProcessIdentity,
} from "../support/electron-process.ts";

const require = createRequire(
  new URL("../../../apps/electron/package.json", import.meta.url),
);
const fixturePath = fileURLToPath(
  new URL("../../fixtures/electron-startup.cjs", import.meta.url),
);

async function withStartupFixture(
  delayed: boolean,
  run: (
    application: ElectronApplication,
    releaseDocument: () => void,
  ) => Promise<void>,
) {
  let blockedScript: ServerResponse | undefined;
  const server = createServer((request, response) => {
    if (request.url === "/document-ready.js") {
      blockedScript = response;
      return;
    }
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><html><head>
      ${delayed ? '<script src="/document-ready.js"></script>' : ""}
      </head><body><aside><a href="/">Downloads</a></aside></body></html>`);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(8500, "127.0.0.1", resolve);
  });
  let application: ElectronApplication | undefined;
  let identity: ProcessIdentity | undefined;
  try {
    application = await _electron.launch({
      executablePath: require("electron") as string,
      args: [fixturePath, ...(delayed ? ["--fixture-delayed-preload"] : [])],
      env: scrubElectronEnvironment(process.env),
    });
    const pid = application.process().pid;
    identity = pid === undefined ? undefined : await readProcessIdentity(pid);
    await run(application, () => {
      expect(blockedScript).toBeDefined();
      blockedScript?.end("// Document may now finish parsing.");
    });
  } finally {
    server.closeAllConnections();
    try {
      try {
        await application?.evaluate(({ BrowserWindow }) => {
          for (const window of BrowserWindow.getAllWindows()) window.destroy();
        });
      } finally {
        await closeElectron(application, identity);
      }
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }
}

test("accepts an already loaded Electron document across repeated starts", async () => {
  for (let attempt = 0; attempt < 6; attempt++) {
    // oxlint-disable-next-line no-await-in-loop -- Exercise fresh process/target attachment on every start.
    await withStartupFixture(false, async (application) => {
      const page = await application.firstWindow();
      await page.waitForFunction(() => document.readyState === "complete");
      expect(await waitForElectronMainWindow(application)).toBe(page);
      await expect(page.locator('aside a[href="/"]')).toBeVisible();
    });
  }
});

test("waits for both document parsing and the real preload bridge", async () => {
  await withStartupFixture(true, async (application, releaseDocument) => {
    const page = await application.firstWindow();
    await expect(page).toHaveURL("http://localhost:8500/");
    let ready = false;
    const mainWindow = waitForElectronMainWindow(application).then((window) => {
      ready = true;
      return window;
    });
    // Observe rejection immediately even if an earlier stage assertion fails.
    void mainWindow.catch(() => {});
    expect(await page.evaluate(() => document.readyState)).toBe("loading");
    expect(ready).toBe(false);
    releaseDocument();
    await page.waitForFunction(() => document.readyState === "complete");
    expect(await page.evaluate(() => "electron" in window)).toBe(false);
    expect(ready).toBe(false);
    await application.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0].webContents.send(
        "fixture:expose-preload",
      );
    });
    expect(await mainWindow).toBe(page);
    await expect(page.locator('aside a[href="/"]')).toBeVisible();
  });
});
