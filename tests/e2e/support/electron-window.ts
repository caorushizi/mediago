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

  // Electron can commit the initial document before Playwright observes its
  // lifecycle event. Check current readiness before starting trace snapshots.
  await page.waitForFunction(
    () =>
      document.readyState !== "loading" &&
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
