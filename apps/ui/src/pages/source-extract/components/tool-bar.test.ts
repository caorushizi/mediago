/** @vitest-environment happy-dom */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  addFavorite: vi.fn(),
  combineToHomePage: vi.fn(),
  goBack: vi.fn(),
  goHome: vi.fn(),
  goto: vi.fn(),
  reload: vi.fn(),
  removeFavorite: vi.fn(),
  setDeviceMode: vi.fn<() => Promise<void>>(),
  showContextMenu: vi.fn(),
  toastAdd: vi.fn(),
}));

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: mocks.toastAdd },
}));

vi.mock("@/hooks/use-favorites", () => ({
  useFavorites: () => ({
    data: [],
    addFavorite: mocks.addFavorite,
    removeFavorite: mocks.removeFavorite,
  }),
}));

vi.mock("@/hooks/use-browser-actions", () => ({
  useBrowserActions: () => ({
    goBack: mocks.goBack,
    goHome: mocks.goHome,
    goto: mocks.goto,
    reload: mocks.reload,
  }),
}));

vi.mock("@/hooks/use-platform", () => ({
  usePlatform: () => ({
    app: { combineToHomePage: mocks.combineToHomePage },
    browser: { setDeviceMode: mocks.setDeviceMode },
    contextMenu: { show: mocks.showContextMenu },
  }),
}));

vi.mock("lucide-react", async () => {
  const { createElement: createIconElement } = await import("react");
  const icon = (name: string) =>
    function Icon(props: Record<string, unknown>) {
      return createIconElement("svg", { ...props, "data-icon": name });
    };
  return {
    ArrowLeft: icon("arrow-left"),
    ArrowRight: icon("arrow-right"),
    Combine: icon("combine"),
    EyeOff: icon("eye-off"),
    House: icon("house"),
    PanelRightOpen: icon("panel-right-open"),
    RefreshCw: icon("refresh"),
    Smartphone: icon("smartphone"),
    Star: icon("star"),
    X: icon("x"),
  };
});

const { ToolBar } = await import("./tool-bar");
const { useBrowserStore } = await import("@/store/browser");
const { useAppStore } = await import("@/store/app");

describe("ToolBar device mode", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.setDeviceMode.mockResolvedValue(undefined);
    useBrowserStore.getState().reset();
    useBrowserStore.getState().hydrateSnapshot({
      tabs: [
        {
          id: "tab-a",
          kind: "user",
          mode: "browser",
          status: "loaded",
          isMobile: false,
          url: "https://example.com",
          title: "Example",
          sources: [],
        },
      ],
      activeTabId: "tab-a",
      sourcePanelCollapsed: false,
    });
    useAppStore.setState({ privacy: false });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(createElement(ToolBar, { page: false }));
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("always renders one smartphone toggle and reflects the active tab", async () => {
    const button = container.querySelector<HTMLButtonElement>(
      'button[aria-label="enableMobileMode"]',
    );
    expect(button?.getAttribute("aria-pressed")).toBe("false");
    expect(button?.querySelector('[data-icon="smartphone"]')).not.toBeNull();
    expect(container.querySelector('[data-icon="monitor"]')).toBeNull();

    await act(async () => {
      useBrowserStore.getState().updateTab("tab-a", { isMobile: true });
    });

    const activeButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="disableMobileMode"]',
    );
    expect(activeButton?.getAttribute("aria-pressed")).toBe("true");
    expect(activeButton?.className).toContain("bg-surface-selected");
  });

  it("switches only the active tab and blocks duplicate clicks", async () => {
    let resolve!: () => void;
    mocks.setDeviceMode.mockReturnValueOnce(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    const button = container.querySelector<HTMLButtonElement>(
      'button[aria-label="enableMobileMode"]',
    );

    await act(async () => {
      button?.click();
    });
    expect(mocks.setDeviceMode).toHaveBeenCalledWith("tab-a", true);
    expect(button?.disabled).toBe(true);

    button?.click();
    expect(mocks.setDeviceMode).toHaveBeenCalledTimes(1);

    await act(async () => resolve());
    expect(button?.disabled).toBe(false);
  });

  it("reports a device switch failure without changing local mode", async () => {
    mocks.setDeviceMode.mockRejectedValueOnce(new Error("failed"));
    const button = container.querySelector<HTMLButtonElement>(
      'button[aria-label="enableMobileMode"]',
    );

    await act(async () => {
      button?.click();
    });

    expect(mocks.toastAdd).toHaveBeenCalledWith({
      title: "switchDeviceModeFailed",
      type: "error",
    });
    expect(useBrowserStore.getState().tabs[0].isMobile).toBe(false);
  });
});
