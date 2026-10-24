import { afterEach, expect, test, vi } from "vitest";

function environment(appId: string | undefined = "analytics-app") {
  const scripts: Array<{
    async: boolean;
    src: string;
    referrerPolicy: string;
    remove: ReturnType<typeof vi.fn>;
  }> = [];
  const onEvent = vi.fn();
  vi.stubGlobal("window", { TDAPP: { onEvent } });
  vi.stubGlobal("document", {
    createElement: () => ({
      async: false,
      src: "",
      referrerPolicy: "",
      remove: vi.fn(),
    }),
    head: {
      appendChild: (script: (typeof scripts)[number]) => scripts.push(script),
    },
  });
  vi.stubEnv("APP_TD_APPID", appId);
  vi.stubEnv("APP_VERSION", "3.6.0-beta.1");
  return { scripts, onEvent };
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

test("configured analytics remains disabled until explicit consent", async () => {
  const { scripts, onEvent } = environment();
  const { tdApp } = await import("./tdapp");
  tdApp.init();
  tdApp.onEvent("PAGE_LOAD", { deviceId: "private-device" });
  expect(scripts).toHaveLength(0);
  expect(onEvent).not.toHaveBeenCalled();
});
test.each([undefined, "", "   "])(
  "consent cannot load an unconfigured SDK (%s)",
  async (appId) => {
    const { scripts } = environment();
    vi.stubEnv("APP_TD_APPID", appId);
    const { tdApp } = await import("./tdapp");
    tdApp.init(true);
    expect(scripts).toHaveLength(0);
  },
);
test("loads once after consent, strips private parameters and stops app events on refusal", async () => {
  const { scripts, onEvent } = environment();
  const { tdApp } = await import("./tdapp");
  tdApp.init(true);
  tdApp.init(true);
  expect(scripts).toHaveLength(1);
  expect(scripts[0]).toMatchObject({
    referrerPolicy: "no-referrer",
    src: "https://jic.talkingdata.com/app/h5/v1?appid=analytics-app&vn=3.6.0-beta.1&vc=3.6.0-beta.1",
  });
  tdApp.onEvent("DOWNLOAD_NOW", {
    deviceId: "secret",
    id: "private-task",
    url: "https://private/",
  });
  expect(onEvent).toHaveBeenLastCalledWith("DOWNLOAD_NOW", "", {});
  tdApp.disable();
  tdApp.onEvent("PAGE_LOAD");
  expect(onEvent).toHaveBeenCalledTimes(1);
  expect(scripts[0].remove).toHaveBeenCalledOnce();
  expect(window.TDAPP).toBeUndefined();
});
