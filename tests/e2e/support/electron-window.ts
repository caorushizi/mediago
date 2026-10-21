import { expect, type ElectronApplication, type Page } from "@playwright/test";

const MAIN_WINDOW_URL = "http://localhost:8500/";

export async function waitForElectronMainWindow(
  application: ElectronApplication,
): Promise<Page> {
  await application.firstWindow();
  await expect
    .poll(() =>
      application.windows().some((page) => page.url() === MAIN_WINDOW_URL),
    )
    .toBe(true);
  const page = application
    .windows()
    .find((candidate) => candidate.url() === MAIN_WINDOW_URL);
  if (!page) throw new Error("Electron main window was not available");

  // A window event only means the debugging target exists. Starting trace
  // snapshots before the initial document is ready can stall the first evaluate.
  await page.waitForLoadState("domcontentloaded", { timeout: 10_000 });
  await page.waitForFunction(
    () =>
      typeof (
        window as Window & {
          electron?: { app?: { getEnvPath?: unknown } };
        }
      ).electron?.app?.getEnvPath === "function",
    undefined,
    { timeout: 10_000 },
  );
  await expect(page.locator('aside a[href="/"]')).toBeVisible();
  return page;
}
