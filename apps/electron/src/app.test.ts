import { createInstance } from "i18next";
import { BASE_I18N_OPTIONS } from "../../../packages/common/src/i18n/config.ts";
import { i18nResources } from "../../../packages/common/src/i18n/resources/index.ts";
import { beforeEach, expect, test, vi } from "vitest";

const electronMocks = vi.hoisted(() => ({
  buildFromTemplate: vi.fn(),
  app: {
    name: "MediaGo",
    getLocale: vi.fn(() => "en"),
    getPreferredSystemLanguages: vi.fn(() => ["zh-CN", "en-US"]),
    on: vi.fn(),
  },
  nativeTheme: { themeSource: "system" },
}));

const i18nMocks = vi.hoisted(() => ({
  changeLanguage: vi.fn(),
  on: vi.fn(),
  t: vi.fn((key: string, _options?: Record<string, unknown>) => key),
}));

const applicationMenuMocks = vi.hoisted(() => ({
  installApplicationMenu: vi.fn(),
}));

const sharedMocks = vi.hoisted(() => ({
  resolveAppLanguage: vi.fn((language: string, systemLanguage?: string) =>
    language === "system" && systemLanguage?.startsWith("zh") ? "zh" : language,
  ),
}));

vi.mock("electron", () => ({
  app: electronMocks.app,
  BrowserWindow: { getAllWindows: vi.fn(() => []) },
  Menu: { buildFromTemplate: electronMocks.buildFromTemplate },
  nativeImage: {},
  nativeTheme: electronMocks.nativeTheme,
  Tray: class Tray {},
}));

vi.mock("./core/i18n", () => ({
  i18n: i18nMocks,
}));

vi.mock("@mediago/common", () => ({
  IpcEvent: { app: { shareIntentAvailable: "share-intent-available" } },
  resolveAppLanguage: sharedMocks.resolveAppLanguage,
}));

vi.mock("../assets/tray.ico", () => ({ default: "tray.ico" }));
vi.mock("../assets/tray.png", () => ({ default: "tray.png" }));
vi.mock("../assets/tray@2x.png", () => ({ default: "tray@2x.png" }));
vi.mock("../assets/trayTemplate.png", () => ({ default: "tray.png" }));
vi.mock("../assets/trayTemplate@2x.png", () => ({ default: "tray@2x.png" }));
vi.mock("./controller", () => ({}));
vi.mock("./core/application-menu", () => ({
  installApplicationMenu: applicationMenuMocks.installApplicationMenu,
}));
vi.mock("./constants", () => ({ db: "/db", isMac: false, logDir: "/log" }));

vi.mock("./core/protocol", () => ({ default: class ProtocolService {} }));
vi.mock("./core/router", () => ({ default: class ElectronRouter {} }));
vi.mock("./services/downloader.server", () => ({
  DownloaderServer: class DownloaderServer {},
}));
vi.mock("./services/go-config-cache", () => ({
  default: class GoConfigCache {},
}));
vi.mock("./services/overlay-dialog.service", () => ({
  default: class OverlayDialogService {},
}));
vi.mock("./services/share-intent.service", () => ({
  default: class ShareIntentService {},
}));
vi.mock("./services/browser-tab-manager.service", () => ({
  default: class BrowserTabManagerService {},
}));
vi.mock("./vendor/ElectronDevtools", () => ({
  default: class ElectronDevtools {},
}));
vi.mock("./vendor/ElectronLogger", () => ({
  default: class ElectronLogger {},
}));
vi.mock("./vendor/ElectronUpdater", () => ({
  default: class ElectronUpdater {},
}));
vi.mock("./windows/browser.window", () => ({
  default: class BrowserWindowService {},
}));
vi.mock("./windows/main.window", () => ({
  default: class MainWindow {},
}));

const { default: ElectronApp } = await import("./app");

beforeEach(() => {
  vi.clearAllMocks();
  i18nMocks.t.mockImplementation((key) => key);
  electronMocks.nativeTheme.themeSource = "system";
  electronMocks.app.getPreferredSystemLanguages.mockReturnValue([
    "zh-CN",
    "en-US",
  ]);
});

test.each([
  ["it", "Esci da MediaGo"],
  ["en", "Quit"],
  ["zh", "退出应用"],
])(
  "renders the %s tray quit label without placeholders",
  async (language, expected) => {
    const translator = createInstance();
    await translator.init({
      ...BASE_I18N_OPTIONS,
      lng: language,
      resources: Object.fromEntries(
        Object.entries(i18nResources).map(([key, translation]) => [
          key,
          { translation },
        ]),
      ),
    });
    i18nMocks.t.mockImplementation((key, options) =>
      translator.t(key, options),
    );
    const { app } = createApp({ blockAds: false, language });
    const tray = { setContextMenu: vi.fn() };
    Reflect.set(app, "tray", tray);

    await app.init();
    const languageListener = i18nMocks.on.mock.calls.find(
      ([event]) => event === "languageChanged",
    )?.[1] as (() => void) | undefined;
    expect(languageListener).toBeTypeOf("function");
    languageListener?.();

    expect(electronMocks.buildFromTemplate).toHaveBeenLastCalledWith([
      { label: translator.t("showMainWindow"), click: expect.any(Function) },
      { label: expected, role: "quit" },
    ]);
    expect(tray.setContextMenu).toHaveBeenCalledOnce();
  },
);

test("seeds initial config before prewarming an enabled ad blocker", async () => {
  const { app, configCache, webviewService } = createApp({ blockAds: true });

  await app.init();

  expect(configCache.seed).toHaveBeenCalledOnce();
  expect(webviewService.setBlocking).toHaveBeenCalledWith(true);
  expect(configCache.seed.mock.invocationCallOrder[0]).toBeLessThan(
    webviewService.setBlocking.mock.invocationCallOrder[0],
  );
});

test("does not apply unrelated initial webview config when ad blocking is off", async () => {
  const { app, webviewService } = createApp({ blockAds: false });

  await app.init();

  expect(webviewService.setBlocking).not.toHaveBeenCalled();
  expect(webviewService.setProxy).not.toHaveBeenCalled();
  expect(webviewService.setDeviceMode).not.toHaveBeenCalled();
  expect(webviewService.setDefaultSession).not.toHaveBeenCalled();
  expect(webviewService.setAudioMuted).not.toHaveBeenCalled();
});

test("rebuilds the application menu when the resolved language changes", async () => {
  const { app, webviewService } = createApp({
    blockAds: false,
    language: "system",
  });

  await app.init();

  const languageListener = i18nMocks.on.mock.calls.find(
    ([event]) => event === "languageChanged",
  )?.[1] as (() => void) | undefined;

  expect(languageListener).toBeTypeOf("function");
  expect(i18nMocks.on.mock.invocationCallOrder[0]).toBeLessThan(
    i18nMocks.changeLanguage.mock.invocationCallOrder[0],
  );
  expect(applicationMenuMocks.installApplicationMenu).toHaveBeenCalledOnce();
  const actions = applicationMenuMocks.installApplicationMenu.mock.calls[0][0];
  expect(actions.reloadVisibleBrowser(true)).toBe(false);
  expect(webviewService.reloadActiveVisibleTab).toHaveBeenCalledWith(true);

  languageListener?.();

  expect(applicationMenuMocks.installApplicationMenu).toHaveBeenCalledTimes(2);
});

test("refreshes a visible browser tab instead of the main renderer", async () => {
  const { app, mainWindow, webviewService } = createApp({ blockAds: false });
  webviewService.reloadActiveVisibleTab.mockReturnValue(true);

  await app.init();

  const listener = mainWindow.window.webContents.on.mock.calls.find(
    ([event]) => event === "before-input-event",
  )?.[1];
  const event = { preventDefault: vi.fn() };
  listener?.(event, {
    alt: false,
    control: false,
    key: "r",
    meta: true,
    shift: false,
    type: "keyDown",
  });

  expect(webviewService.reloadActiveVisibleTab).toHaveBeenCalledWith(false);
  expect(event.preventDefault).toHaveBeenCalledOnce();
});

test("keeps the main renderer refresh outside the browser page", async () => {
  const { app, mainWindow, webviewService } = createApp({ blockAds: false });
  webviewService.reloadActiveVisibleTab.mockReturnValue(false);

  await app.init();

  const listener = mainWindow.window.webContents.on.mock.calls.find(
    ([event]) => event === "before-input-event",
  )?.[1];
  const event = { preventDefault: vi.fn() };
  listener?.(event, {
    alt: false,
    control: false,
    key: "F5",
    meta: false,
    shift: false,
    type: "keyDown",
  });

  expect(webviewService.reloadActiveVisibleTab).toHaveBeenCalledWith(false);
  expect(event.preventDefault).not.toHaveBeenCalled();
});

test("resolves follow-system language from the OS preferred language", async () => {
  const { app } = createApp({ blockAds: false, language: "system" });

  await app.init();

  expect(sharedMocks.resolveAppLanguage).toHaveBeenCalledWith(
    "system",
    "zh-CN",
  );
  expect(i18nMocks.changeLanguage).toHaveBeenCalledWith("zh");
  expect(electronMocks.app.getLocale).not.toHaveBeenCalled();
});

test("restores the main window when an ordinary second instance is launched", () => {
  const { app, mainWindow, shareIntentService } = createApp({});
  shareIntentService.handleCommandLine.mockReturnValue({ handled: false });

  expect(app.handleSecondInstance(["/opt/MediaGo/mediago"])).toBe(false);

  expect(mainWindow.showWindow).toHaveBeenCalledOnce();
});

test("defers restoring a second instance until the app is ready", () => {
  const { app, mainWindow, shareIntentService } = createApp({});
  shareIntentService.handleCommandLine.mockReturnValue({ handled: false });

  app.handleSecondInstance(["/opt/MediaGo/mediago"], false);

  expect(mainWindow.showWindow).not.toHaveBeenCalled();
});

test("continues startup when the system tray is unavailable", async () => {
  const { app, logger, mainWindow } = createApp({ blockAds: false });
  const trayError = new Error("system tray unavailable");
  vi.spyOn(app, "initTray").mockImplementation(() => {
    throw trayError;
  });

  await expect(app.init()).resolves.toBeUndefined();

  expect(logger.error).toHaveBeenCalledWith(
    "[ElectronApp] Failed to initialize system tray:",
    trayError,
  );
  expect(mainWindow.init).toHaveBeenCalledOnce();
});

test("destroys browser executors before stopping Core", async () => {
  const { app, downloaderServer, webviewService } = createApp({});

  await app.shutdown();

  expect(webviewService.destroy).toHaveBeenCalledOnce();
  expect(downloaderServer.stop).toHaveBeenCalledOnce();
  expect(webviewService.destroy.mock.invocationCallOrder[0]).toBeLessThan(
    downloaderServer.stop.mock.invocationCallOrder[0],
  );
});

function createApp(config: Record<string, unknown>) {
  const mainWebContents = { on: vi.fn() };
  const mainWindow = {
    init: vi.fn(),
    send: vi.fn(),
    showWindow: vi.fn(),
    window: { webContents: mainWebContents },
  };
  const protocol = { create: vi.fn() };
  const updater = {
    changeAllowBeta: vi.fn(),
    changeAutoUpgrade: vi.fn(),
    init: vi.fn(),
  };
  const router = { init: vi.fn() };
  const devTools = { init: vi.fn() };
  const downloaderServer = {
    getClient: vi.fn(() => ({
      getConfig: vi.fn(async () => ({ data: config })),
    })),
    on: vi.fn(),
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
  };
  const webviewService = {
    destroy: vi.fn(),
    reloadActiveVisibleTab: vi.fn(() => false),
    reparentActiveView: vi.fn(),
    setAudioMuted: vi.fn(),
    setBlocking: vi.fn(),
    setDefaultSession: vi.fn(),
    setProxy: vi.fn(),
    setDeviceMode: vi.fn(),
  };
  const overlayDialogService = { init: vi.fn() };
  const configCache = {
    get: vi.fn(),
    seed: vi.fn(),
    update: vi.fn(),
  };
  const browserWindow = { send: vi.fn() };
  const logger = { error: vi.fn() };
  const shareIntentService = {
    handleCommandLine: vi.fn(),
    handleProtocolUrl: vi.fn(),
    hasPending: vi.fn(() => false),
  };
  const app = new ElectronApp(
    mainWindow as never,
    protocol as never,
    updater as never,
    router as never,
    devTools as never,
    downloaderServer as never,
    webviewService as never,
    overlayDialogService as never,
    configCache as never,
    browserWindow as never,
    logger as never,
    shareIntentService as never,
  );
  vi.spyOn(app, "initTray").mockImplementation(() => undefined);

  return {
    app,
    configCache,
    downloaderServer,
    logger,
    mainWindow,
    shareIntentService,
    webviewService,
  };
}
