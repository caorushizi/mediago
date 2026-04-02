import { join } from "node:path";
import { tmpdir } from "node:os";
import { EventEmitter } from "node:events";
import { mkdtemp, writeFile } from "node:fs/promises";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

const mockPortfinder = {
  getPortPromise: vi.fn<(options?: { port?: number }) => Promise<number>>(),
};

const spawnMock =
  vi.fn<
    (
      command: string,
      args?: readonly string[],
      options?: Record<string, unknown>,
    ) => ChildProcessWithoutNullStreams
  >();

const killMock =
  vi.fn<
    (
      pid: number,
      signal: NodeJS.Signals | string | undefined,
      callback: (error?: NodeJS.ErrnoException | null) => void,
    ) => void
  >();

vi.mock("portfinder", () => ({
  default: mockPortfinder,
}));

vi.mock("node:child_process", () => ({
  spawn: (...args: Parameters<typeof spawnMock>) => spawnMock(...args),
}));

vi.mock("tree-kill", () => ({
  default: (...args: Parameters<typeof killMock>) => killMock(...args),
}));

const fetchMock =
  vi.fn<
    (
      input: string | URL,
      init?: unknown,
    ) => Promise<{ ok: boolean; status: number }>
  >();

let originalFetch: typeof fetch;

beforeAll(() => {
  originalFetch = globalThis.fetch;
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

class MockChildProcess extends EventEmitter {
  stdout: NodeJS.ReadableStream;
  stderr: NodeJS.ReadableStream;
  pid: number;
  killed = false;

  constructor(pid: number) {
    super();
    this.pid = pid;
    this.stdout = new EventEmitter() as unknown as NodeJS.ReadableStream;
    this.stderr = new EventEmitter() as unknown as NodeJS.ReadableStream;
  }
}

let lastSpawnedChild: MockChildProcess | null = null;
let nextPid = 4_000;

async function createExecutableFixture() {
  const dir = await mkdtemp(join(tmpdir(), "service-runner-"));
  const baseName = "dummy-service";
  const fileName = process.platform === "win32" ? `${baseName}.exe` : baseName;
  const filePath = join(dir, fileName);
  await writeFile(filePath, "", { mode: 0o755 });
  return { dir, name: baseName };
}

const executableFixturePromise = createExecutableFixture();

beforeEach(() => {
  vi.clearAllMocks();
  lastSpawnedChild = null;
  nextPid = 4_000;

  mockPortfinder.getPortPromise.mockImplementation(async (options) => {
    return (options?.port ?? 0) || 5_000;
  });

  spawnMock.mockImplementation(() => {
    const child = new MockChildProcess(nextPid++);
    lastSpawnedChild = child;
    return child as unknown as ChildProcessWithoutNullStreams;
  });

  killMock.mockImplementation((_pid, _signal, callback) => {
    if (lastSpawnedChild) {
      lastSpawnedChild.killed = true;
      queueMicrotask(() => {
        lastSpawnedChild?.emit("exit", null, null);
      });
    }
    callback?.(null);
  });

  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
  });
});

afterEach(() => {
  lastSpawnedChild = null;
});

describe("ServiceRunner", () => {
  test("starts service, waits for healthy state, and stops gracefully", async () => {
    const { ServiceRunner } = await import("../src/index");
    const fixture = await executableFixturePromise;

    mockPortfinder.getPortPromise.mockResolvedValueOnce(6_789);

    const runner = new ServiceRunner({
      executableDir: fixture.dir,
      executableName: fixture.name,
      preferredPort: 4_321,
    });

    const initialState = await runner.start();

    expect(spawnMock).toHaveBeenCalledTimes(1);
    const [, , spawnOptions] = spawnMock.mock.calls[0];
    expect(spawnOptions?.env).toMatchObject({
      PORT: "6789",
      HOST: "127.0.0.1",
    });

    expect(fetchMock).toHaveBeenCalled();
    const requestURL = fetchMock.mock.calls[0][0];
    expect(String(requestURL)).toBe("http://127.0.0.1:6789/healthy");

    expect(initialState.port).toBe(6_789);
    expect(initialState.host).toBe("127.0.0.1");
    expect(initialState.started).toBe(true);
    expect(runner.isRunning()).toBe(true);
    expect(await runner.checkHealth()).toBe(true);

    const secondStartState = await runner.start();
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(secondStartState.port).toBe(initialState.port);

    mockPortfinder.getPortPromise.mockResolvedValueOnce(9_001);
    const restartedState = await runner.restart({
      preferredPort: 9_000,
      extraEnv: { CUSTOM_FLAG: "1" },
    });

    expect(spawnMock).toHaveBeenCalledTimes(2);
    const [, , secondSpawnOptions] = spawnMock.mock.calls[1];
    expect(secondSpawnOptions?.env).toMatchObject({
      PORT: "9001",
      HOST: "127.0.0.1",
      CUSTOM_FLAG: "1",
    });
    expect(restartedState.port).toBe(9_001);
    expect(restartedState.started).toBe(true);
    expect(killMock).toHaveBeenCalledTimes(1);
    expect(runner.isRunning()).toBe(true);

    await runner.stop();
    expect(killMock).toHaveBeenCalledTimes(2);
    expect(runner.isRunning()).toBe(false);
  });

  test("resolves host from LAN when internal flag is false", async () => {
    const { ServiceRunner } = await import("../src/index");
    const fixture = await executableFixturePromise;

    const originalFinder = Reflect.get(
      ServiceRunner as object,
      "findLanIPv4Address",
    ) as (() => string | undefined) | undefined;

    Reflect.set(
      ServiceRunner as object,
      "findLanIPv4Address",
      vi.fn(() => "10.0.0.42"),
    );

    mockPortfinder.getPortPromise.mockResolvedValueOnce(5_555);

    const runner = new ServiceRunner({
      executableDir: fixture.dir,
      executableName: fixture.name,
      internal: false,
    });

    try {
      const state = await runner.start();
      expect(state.host).toBe("10.0.0.42");
      expect(state.url).toBe("http://10.0.0.42:5555");
      expect(fetchMock).toHaveBeenCalled();
      const requestURL = fetchMock.mock.calls[0][0];
      expect(String(requestURL)).toBe("http://10.0.0.42:5555/healthy");
    } finally {
      await runner.stop();
      if (originalFinder) {
        Reflect.set(
          ServiceRunner as object,
          "findLanIPv4Address",
          originalFinder,
        );
      }
    }
  });

  test("rejects when health checks do not pass within timeout", async () => {
    const { ServiceRunner } = await import("../src/index");
    const fixture = await executableFixturePromise;

    mockPortfinder.getPortPromise.mockResolvedValueOnce(7_001);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
    });

    const runner = new ServiceRunner({
      executableDir: fixture.dir,
      executableName: fixture.name,
      healthCheckTimeoutMs: 100,
      healthCheckIntervalMs: 10,
      healthRequestTimeoutMs: 10,
    });

    vi.useFakeTimers();
    const startPromise = runner.start();

    await vi.runAllTimersAsync();

    await expect(startPromise).rejects.toThrow(/failed health check/i);
    expect(runner.isRunning()).toBe(false);

    await runner.stop().catch(() => undefined);
    vi.useRealTimers();
  });
});
