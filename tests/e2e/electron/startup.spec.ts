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
import { runIndependentCleanup } from "../support/cleanup.ts";
import { assertPortFree } from "../support/ports.ts";
import { scrubElectronEnvironment } from "../support/electron-network.ts";
import {
  closeElectron,
  readProcessIdentity,
  withDeadline,
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
  options: { pauseAnimationFrames?: boolean; hideNavigation?: boolean } = {},
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
      <script>
        if (${Boolean(options.pauseAnimationFrames)}) {
          window.requestAnimationFrame = () => 0;
          window.fixtureFramesPaused = true;
        }
      </script>
      </head><body><aside ${options.hideNavigation ? 'style="display:none"' : ""}><a href="/">Downloads</a></aside></body></html>`);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(8500, "127.0.0.1", resolve);
  });
  let application: ElectronApplication | undefined;
  let identity: ProcessIdentity | undefined;
  let primaryError: unknown;
  let cleanupErrors: unknown[] = [];
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
  } catch (error) {
    primaryError = error;
  } finally {
    cleanupErrors = await runIndependentCleanup([
      {
        name: "startup Electron",
        run: async () => {
          try {
            if (application)
              await withDeadline(
                application.evaluate(({ BrowserWindow }) => {
                  for (const window of BrowserWindow.getAllWindows())
                    window.destroy();
                }),
                2_000,
                "destroy fixture windows",
              );
          } finally {
            await closeElectron(application, identity);
          }
        },
      },
      {
        name: "startup UI listener",
        run: async () => {
          server.closeAllConnections();
          await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
        },
      },
    ]);
  }
  if (primaryError !== undefined) {
    if (cleanupErrors.length)
      throw new AggregateError(
        [primaryError, ...cleanupErrors],
        "Startup and cleanup failed",
        { cause: primaryError },
      );
    throw primaryError;
  }
  if (cleanupErrors.length)
    throw new AggregateError(cleanupErrors, "Startup fixture cleanup failed");
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

test("starts with a hidden window even when animation frames are suspended", async () => {
  await withStartupFixture(
    false,
    async (application) => {
      const page = await waitForElectronMainWindow(application);
      expect(
        await page.evaluate(
          () =>
            (window as Window & { fixtureFramesPaused?: boolean })
              .fixtureFramesPaused,
        ),
      ).toBe(true);
      expect(await page.locator('aside a[href="/"]').isVisible()).toBe(true);
    },
    { pauseAnimationFrames: true },
  );
});

test("failed startup releases its UI port before the next Electron start", async () => {
  await withStartupFixture(
    false,
    async (application) => {
      await expect(
        waitForElectronMainWindow(application, 1_000),
      ).rejects.toThrow("Electron startup failed while waiting for");
    },
    { hideNavigation: true },
  );
  await assertPortFree("127.0.0.1", 8500, "next Electron fixture");
  await withStartupFixture(false, async (application) => {
    await waitForElectronMainWindow(application);
  });
});
