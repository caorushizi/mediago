import "reflect-metadata";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { AppLanguage } from "@mediago/shared-common";
import { AppLanguage as LanguageEnum, AppTheme as ThemeEnum, i18n } from "@mediago/shared-common";
import type {
  AppStore,
  ConversionRepository,
  DownloadManagementService,
  FavoriteManagementService,
} from "@mediago/shared-node";
import type { IpcMainEvent } from "electron";
import { nativeTheme } from "electron";
import HomeController from "../HomeController";
import type WebviewService from "../../services/WebviewService";
import type ElectronStore from "../../vendor/ElectronStore";
import type ElectronLogger from "../../vendor/ElectronLogger";
import type ElectronUpdater from "../../vendor/ElectronUpdater";
import type BrowserWindow from "../../windows/BrowserWindow";
import type MainWindow from "../../windows/MainWindow";

class MockElectronStore {
  public store: AppStore;

  public readonly setCalls: Array<{
    key: keyof AppStore;
    value: AppStore[keyof AppStore];
  }> = [];

  constructor(initial?: Partial<AppStore>) {
    this.store = {
      local: "",
      promptTone: true,
      proxy: "",
      useProxy: false,
      deleteSegments: true,
      openInNewWindow: false,
      mainBounds: undefined,
      browserBounds: undefined,
      blockAds: true,
      theme: ThemeEnum.System,
      useExtension: false,
      isMobile: false,
      maxRunner: 2,
      language: LanguageEnum.System,
      showTerminal: false,
      privacy: false,
      machineId: "",
      downloadProxySwitch: false,
      autoUpgrade: true,
      allowBeta: false,
      closeMainWindow: false,
      audioMuted: true,
      enableDocker: false,
      dockerUrl: "",
      ...initial,
    };
  }

  get<K extends keyof AppStore>(key: K): AppStore[K] {
    return this.store[key];
  }

  set<K extends keyof AppStore>(key: K, value: AppStore[K]): void {
    this.store[key] = value;
    this.setCalls.push({ key, value });
  }
}

class MockWebviewService {
  public readonly proxyCalls: Array<[boolean, string]> = [];
  public readonly blockingArgs: boolean[] = [];
  public readonly userAgentArgs: boolean[] = [];
  public readonly defaultSessionArgs: boolean[] = [];
  public readonly audioMutedArgs: boolean[] = [];

  setProxy(useProxy: boolean, proxy: string): void {
    this.proxyCalls.push([useProxy, proxy]);
  }

  setBlocking(block: boolean): void {
    this.blockingArgs.push(block);
  }

  setUserAgent(isMobile: boolean): void {
    this.userAgentArgs.push(isMobile);
  }

  setDefaultSession(privacy: boolean): void {
    this.defaultSessionArgs.push(privacy);
  }

  setAudioMuted(muted: boolean): void {
    this.audioMutedArgs.push(muted);
  }
}

class MockUpdater {
  public readonly allowBetaArgs: boolean[] = [];

  changeAllowBeta(allow: boolean): void {
    this.allowBetaArgs.push(allow);
  }
}

type ControllerDeps = {
  store: MockElectronStore;
  webviewService: MockWebviewService;
  updater: MockUpdater;
  controller: HomeController;
  changeLanguageCalls: AppLanguage[];
};

describe("HomeController#setAppStore", () => {
  let deps: ControllerDeps;
  const noop = () => undefined;
  const originalChangeLanguage = i18n.changeLanguage.bind(i18n);

  beforeEach(() => {
    const store = new MockElectronStore({ proxy: "http://proxy" });
    const webviewService = new MockWebviewService();
    const updater = new MockUpdater();
    const changeLanguageCalls: AppLanguage[] = [];

    (i18n as unknown as { changeLanguage: (lang: AppLanguage) => Promise<void> }).changeLanguage = async (
      lang: AppLanguage,
    ) => {
      changeLanguageCalls.push(lang);
    };

    const controller = new HomeController(
      store as unknown as ElectronStore,
      {} as FavoriteManagementService,
      { send: noop } as unknown as MainWindow,
      {} as DownloadManagementService,
      {} as BrowserWindow,
      webviewService as unknown as WebviewService,
      {} as ConversionRepository,
      {} as ElectronLogger,
      updater as unknown as ElectronUpdater,
    );

    deps = {
      store,
      webviewService,
      updater,
      controller,
      changeLanguageCalls,
    };
  });

  afterEach(() => {
    (i18n as unknown as { changeLanguage: typeof originalChangeLanguage }).changeLanguage = originalChangeLanguage;
    nativeTheme.themeSource = "system";
  });

  it("enables proxy by delegating to the webview service", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "useProxy", true);

    assert.deepEqual(deps.webviewService.proxyCalls, [[true, "http://proxy"]]);
    assert.equal(deps.store.store.useProxy, true);
    assert.deepEqual(deps.store.setCalls, [{ key: "useProxy", value: true }]);
  });

  it("updates proxy details when proxy usage is already enabled", async () => {
    deps.store.store.useProxy = true;

    await deps.controller.setAppStore({} as IpcMainEvent, "proxy", "http://new");

    assert.deepEqual(deps.webviewService.proxyCalls, [[true, "http://new"]]);
    assert.equal(deps.store.store.proxy, "http://new");
    assert.deepEqual(deps.store.setCalls, [{ key: "proxy", value: "http://new" }]);
  });

  it("does not trigger proxy updates when proxy usage is disabled", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "proxy", "http://new");

    assert.deepEqual(deps.webviewService.proxyCalls, []);
    assert.equal(deps.store.store.proxy, "http://new");
  });

  it("toggles ad blocking", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "blockAds", false);

    assert.deepEqual(deps.webviewService.blockingArgs, [false]);
    assert.equal(deps.store.store.blockAds, false);
  });

  it("switches theme via nativeTheme", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "theme", ThemeEnum.Dark);

    assert.equal(nativeTheme.themeSource, ThemeEnum.Dark);
    assert.equal(deps.store.store.theme, ThemeEnum.Dark);
  });

  it("updates the user agent when toggling mobile mode", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "isMobile", true);

    assert.deepEqual(deps.webviewService.userAgentArgs, [true]);
    assert.equal(deps.store.store.isMobile, true);
  });

  it("switches privacy mode", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "privacy", true);

    assert.deepEqual(deps.webviewService.defaultSessionArgs, [true]);
    assert.equal(deps.store.store.privacy, true);
  });

  it("changes language via i18n", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "language", LanguageEnum.EN);

    assert.deepEqual(deps.changeLanguageCalls, [LanguageEnum.EN]);
    assert.equal(deps.store.store.language, LanguageEnum.EN);
  });

  it("updates beta channel preference", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "allowBeta", true);

    assert.deepEqual(deps.updater.allowBetaArgs, [true]);
    assert.equal(deps.store.store.allowBeta, true);
  });

  it("toggles audio mute state", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "audioMuted", false);

    assert.deepEqual(deps.webviewService.audioMutedArgs, [false]);
    assert.equal(deps.store.store.audioMuted, false);
  });

  it("persists keys without handlers directly", async () => {
    await deps.controller.setAppStore({} as IpcMainEvent, "promptTone", false);

    assert.deepEqual(deps.webviewService.proxyCalls, []);
    assert.deepEqual(deps.store.setCalls, [{ key: "promptTone", value: false }]);
    assert.equal(deps.store.store.promptTone, false);
  });
});
