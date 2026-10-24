import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { assertPortFree } from "../support/ports";

const fixture = fileURLToPath(
  new URL("../../fixtures/ui-primitives/index.html", import.meta.url),
).replaceAll("\\", "/");
const baseURL = "http://127.0.0.1:8501";
const fixtureURL = `${baseURL}/@fs${fixture.startsWith("/") ? fixture : "/" + fixture}`;
let stopUI: (() => Promise<void>) | undefined;
let previousTarget: string | undefined;
const runtimeErrors = new WeakMap<Page, string[]>();

test.beforeAll(async () => {
  previousTarget = process.env.APP_TARGET;
  process.env.APP_TARGET = "server";
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const require = createRequire(path.join(root, "apps/ui/package.json"));
  const { createServer } = await import(
    pathToFileURL(require.resolve("vite")).href
  );
  await assertPortFree("127.0.0.1", 8501, "UI primitives regression");
  const server = await createServer({
    root: path.join(root, "apps/ui"),
    configFile: path.join(root, "apps/ui/vite.config.ts"),
    server: { host: "127.0.0.1", port: 8501, strictPort: true },
  });
  stopUI = () => server.close();
  await server.listen();
});

test.afterAll(async () => {
  await stopUI?.();
  if (previousTarget === undefined) delete process.env.APP_TARGET;
  else process.env.APP_TARGET = previousTarget;
});

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("createRoot")) {
      errors.push(message.text());
    }
  });
  await page.goto(fixtureURL);
  await expect(
    page.getByRole("heading", { name: "MediaGo UI interaction regression" }),
  ).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(
    runtimeErrors.get(page),
    "fixture must mount once without runtime errors",
  ).toEqual([]);
});

test("keeps nested dialog focus, translated select labels and dismiss behavior", async ({
  page,
}) => {
  const trigger = page.getByRole("button", {
    name: "Open preferences",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Preferences", exact: true });
  await expect(
    dialog.getByRole("textbox", { name: "Name", exact: true }),
  ).toBeFocused();
  const language = dialog.getByRole("combobox", { name: "Language" });
  await expect(language).toHaveText("简体中文");
  await language.click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await expect(language).toHaveText("English");
  await dialog.getByRole("button", { name: "Advanced", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Advanced name" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Advanced preferences" }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("button", { name: "Advanced", exact: true }),
  ).toBeFocused();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.mouse.click(5, 5);
  await expect(dialog).toHaveCount(0);
  expect(await page.locator("button button").count()).toBe(0);
});

test("supports mixed checkbox, keyboard switches, radios and disabled cursors", async ({
  page,
}, testInfo) => {
  const checkbox = page.getByRole("checkbox", {
    name: "Select files",
    exact: true,
  });
  await expect(checkbox).toBeChecked({ indeterminate: true });
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  const disabled = page.getByRole("checkbox", { name: "Unavailable file" });
  await expect(disabled).toBeDisabled();
  await expect(disabled).toHaveCSS("cursor", "not-allowed");
  const toggle = page.getByRole("switch", { name: "Automatic updates" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.getByRole("radio", { name: "Normal", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("radio", { name: "Fast", exact: true }),
  ).toBeChecked();
  const disabledLink = page.getByRole("button", { name: "Disabled link" });
  await expect(disabledLink).toBeDisabled();
  await expect(disabledLink).toHaveCSS("cursor", "not-allowed");
  await expect(
    page.getByRole("progressbar", { name: "Download progress" }),
  ).toHaveAttribute("aria-valuenow", "25");
  const progressRatio = await page
    .locator('[data-slot="progress-indicator"]')
    .evaluate((element) => {
      const track = element.parentElement;
      if (!track) throw new Error("Missing progress track");
      return (
        element.getBoundingClientRect().width /
        track.getBoundingClientRect().width
      );
    });
  expect(progressRatio).toBeCloseTo(0.25, 2);
  await page.screenshot({
    path: testInfo.outputPath("base-ui-controls.png"),
    fullPage: true,
  });
});

test("fires menu actions once with keyboard and preserves submenus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Actions", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("menuitem", { name: "Refresh", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Action count")).toHaveText("1");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await trigger.click();
  await expect(
    page.getByRole("menuitem", { name: "Unavailable action" }),
  ).toBeDisabled();
  await page.getByRole("menuitem", { name: "More actions" }).hover();
  await page.getByRole("menuitem", { name: "Export", exact: true }).click();
  await expect(page.getByLabel("Action count")).toHaveText("11");
  await page.getByText("Extension name", { exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Extension name" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Extension action" }).click();
  await expect(page.getByLabel("Action count")).toHaveText("111");
});

test("shows tooltip and preview content and scrolls the player sheet", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Download shortcuts", exact: true })
    .hover();
  await expect(page.locator('[data-slot="tooltip-content"]')).toHaveText(
    "Download shortcuts",
  );
  await page.getByRole("button", { name: "Preview", exact: true }).hover();
  await expect(
    page.getByText("Local download preview", { exact: true }),
  ).toBeVisible();
  const infoTrigger = page.getByRole("button", {
    name: "About statistics",
    exact: true,
  });
  await infoTrigger.focus();
  await page.keyboard.press("Enter");
  const info = page.getByRole("dialog", {
    name: "Statistics information",
    exact: true,
  });
  await expect(info).toContainText("Statistics are optional.");
  await info
    .getByRole("button", { name: "Privacy policy", exact: true })
    .click();
  await expect(page.getByLabel("Action count")).toHaveText("1");
  await page.keyboard.press("Escape");
  await expect(info).toHaveCount(0);
  await expect(infoTrigger).toBeFocused();
  await page.getByRole("button", { name: "Playlist", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Playlist", exact: true });
  await expect(sheet).toBeVisible();
  const viewport = sheet.locator("[data-slot=scroll-area-viewport]");
  await viewport.evaluate((element) => {
    element.scrollTop = 200;
  });
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Playlist", exact: true }),
  ).toBeFocused();
});

for (const surface of ["main", "extension"]) {
  test.describe(surface + " Base UI toast", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(fixtureURL + "?toast=1&surface=" + surface);
      await expect(
        page.getByRole("heading", { name: "Toast interaction regression" }),
      ).toBeVisible();
    });

    test("keeps startup messages, status variants, keyboard actions and localized close controls", async ({
      page,
    }, testInfo) => {
      const notifications = page.locator('[data-slot="toast-viewport"]');
      const items = notifications.locator('[data-slot="toast"]');
      await expect(items).toHaveCount(1);
      await expect(items).toContainText("Startup notification");
      await items.hover();
      await items.getByRole("button", { name: "Close", exact: true }).click();
      await expect(items).toHaveCount(0);
      for (const type of ["success", "error", "warning", "info"]) {
        await page
          .getByRole("button", { name: "Show " + type, exact: true })
          .click();
        await expect(items).toHaveAttribute("data-type", type);
        await expect(items.locator('[data-slot="toast-title"]')).toHaveText(
          type + " notification",
        );
        await expect(items.locator('[data-slot="toast-icon"]')).toBeVisible();
        await items.hover();
        const close = items.getByRole("button", { name: "Close", exact: true });
        await expect(close).toHaveCSS("cursor", "pointer");
        await close.click();
        await expect(items).toHaveCount(0);
      }
      const trigger = page.getByRole("button", {
        name: "Show action",
        exact: true,
      });
      await trigger.click();
      await items.hover();
      await items.screenshot({
        path: testInfo.outputPath(surface + "-toast-action.png"),
      });
      await page.keyboard.press("F6");
      await expect(notifications).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(items).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        items.getByRole("button", { name: "Retry", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.getByLabel("Toast action count")).toHaveText("1");
      await page.keyboard.press("Tab");
      await expect(
        items.getByRole("button", { name: "Close", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(items).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await page.getByRole("button", { name: "Chinese labels" }).click();
      await trigger.click();
      await expect(notifications).toHaveAttribute("aria-label", "通知");
      await items.hover();
      await expect(
        items.getByRole("button", { name: "关闭", exact: true }),
      ).toBeVisible();
    });

    test("shows download errors above a dialog without closing it or stealing focus", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Clear notices", exact: true })
        .click();
      await expect(page.locator('[data-slot="toast"]')).toHaveCount(0);
      const trigger = page.getByRole("button", {
        name: "Open download",
        exact: true,
      });
      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: "Add download",
        exact: true,
      });
      const report = dialog.getByRole("button", {
        name: "Report download error",
        exact: true,
      });
      await report.click();
      const notice = page.getByRole("dialog", {
        name: "Download failed",
        exact: true,
      });
      await expect(notice).toBeVisible();
      await expect(report).toBeFocused();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await notice.hover();
      await notice.getByRole("button", { name: "Close", exact: true }).click();
      await expect(notice).toHaveCount(0);
    });

    test("pauses automatic dismissal during hover and resumes the 2.4-second countdown", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Clear notices", exact: true })
        .click();
      const items = page.locator('[data-slot="toast"]');
      await expect(items).toHaveCount(0);
      await page
        .getByRole("button", { name: "Show success", exact: true })
        .click();
      await expect(items).toBeVisible();
      await items.hover();
      await page.waitForTimeout(2700);
      await expect(items).toBeVisible();
      await page.mouse.move(5, 500);
      await expect(items).toHaveCount(0, { timeout: 5000 });
    });

    test("limits and expands stacked notices without overlap and supports swipe dismissal", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Clear notices", exact: true })
        .click();
      const items = page.locator('[data-slot="toast"]');
      await expect(items).toHaveCount(0);
      await page
        .getByRole("button", { name: "Queue notices", exact: true })
        .click();
      await expect(items).toHaveCount(5);
      await expect(
        items.filter({
          has: page.locator("[data-slot=toast-title]", {
            hasText: "Queued notification 5",
          }),
        }),
      ).toBeVisible();
      const visible = page.locator('[data-slot="toast"]:not([data-limited])');
      await expect(visible).toHaveCount(3);
      await expect(
        page.locator('[data-slot="toast"][data-limited][inert]'),
      ).toHaveCount(2);
      await visible.first().hover();
      await expect(visible.first()).toHaveAttribute("data-expanded", "");
      await expect
        .poll(async () =>
          visible.evaluateAll((elements) => {
            const bounds = elements
              .map((element) => element.getBoundingClientRect())
              .sort((a, b) => a.top - b.top);
            return bounds
              .slice(1)
              .every((box, index) => box.top >= bounds[index].bottom);
          }),
        )
        .toBe(true);
      await page
        .getByRole("button", { name: "Clear notices", exact: true })
        .click();
      await expect(items).toHaveCount(0);
      await page
        .getByRole("button", { name: "Show action", exact: true })
        .click();
      const title = items.locator('[data-slot="toast-title"]');
      await items.hover();
      await expect(items).toHaveCSS("cursor", "grab");
      const box = await title.boundingBox();
      if (!box) throw new Error("Toast title is missing");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await expect(items).toHaveCSS("cursor", "grabbing");
      await page.mouse.move(
        box.x + box.width / 2 + 160,
        box.y + box.height / 2,
        { steps: 12 },
      );
      await page.mouse.up();
      await expect(items).toHaveCount(0);
    });

    test("fits long messages on narrow screens and follows the dark theme", async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 360, height: 720 });
      await page
        .getByRole("button", { name: "Clear notices", exact: true })
        .click();
      const items = page.locator('[data-slot="toast"]');
      await expect(items).toHaveCount(0);
      await page
        .getByRole("button", { name: "Show long notice", exact: true })
        .click();
      await expect(items).toBeVisible();
      await items.hover();
      await expect(
        items.getByRole("button", { name: "Close", exact: true }),
      ).toBeInViewport();
      const colors = await items.evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        width: element.getBoundingClientRect().width,
        left: element.getBoundingClientRect().left,
        scrollWidth: element.scrollWidth,
      }));
      expect(colors.left).toBeCloseTo(16, 0);
      expect(colors.width).toBeCloseTo(328, 0);
      expect(colors.scrollWidth).toBeLessThanOrEqual(328);
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      await expect
        .poll(() =>
          items.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
          ),
        )
        .not.toBe(colors.background);
      await page.screenshot({
        path: testInfo.outputPath(surface + "-base-ui-toast.png"),
        fullPage: true,
      });
    });
  });
}
