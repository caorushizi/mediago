import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaGoClient } from '../src';
import * as EventSourceModule from 'eventsource';

vi.mock('eventsource', () => {
  const instances: any[] = [];

  class BaseEvent {
    type: string;
    constructor(type: string) {
      this.type = type;
    }
  }

  class MockErrorEvent extends BaseEvent {
    code?: number;
    message?: string;
    constructor(type: string, init: { code?: number; message?: string } = {}) {
      super(type);
      this.code = init.code;
      this.message = init.message;
    }
  }

  class MockMessageEvent<T = unknown> extends BaseEvent {
    data: T | null;
    constructor(type: string, init: { data?: T | null } = {}) {
      super(type);
      this.data = init.data ?? null;
    }
  }

  type Listener = (event: any) => void;

  class MockEventSource {
    readonly url: string;
    closed = false;
    private readonly listeners = new Map<string, Set<Listener>>();

    constructor(url: string) {
      this.url = url;
      instances.push(this);
    }

    addEventListener(type: string, listener: Listener): void {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)!.add(listener);
    }

    removeEventListener(type: string, listener: Listener): void {
      this.listeners.get(type)?.delete(listener);
    }

    close(): void {
      this.closed = true;
      this.listeners.clear();
    }

    dispatch(type: string, init: { data?: unknown; code?: number; message?: string } = {}): void {
      const listeners = this.listeners.get(type);
      if (!listeners || listeners.size === 0) {
        return;
      }

      const event =
        type === 'error'
          ? new MockErrorEvent(type, { code: init.code, message: init.message })
          : new MockMessageEvent(type, { data: init.data });

      for (const listener of listeners) {
        listener(event);
      }
    }
  }

  return {
    default: MockEventSource,
    EventSource: MockEventSource,
    ErrorEvent: MockErrorEvent,
    __instances: instances,
  };
});

const getInstances = () =>
  ((EventSourceModule as unknown as { __instances: any[] }).__instances) ?? [];

describe('MediaGoClient.streamEvents', () => {
  beforeEach(() => {
    getInstances().length = 0;
  });

  it('connects to /api/events and re-emits task events', () => {
    const client = new MediaGoClient({ baseURL: 'http://example.com' });
    const emitter = client.streamEvents();

    const instances = getInstances();
    expect(instances).toHaveLength(1);
    expect(instances[0]?.url).toBe('http://example.com/api/events');

    const onStart = vi.fn();
    emitter.on('download-start', onStart);

    instances[0]?.dispatch('download-start', {
      data: JSON.stringify({ id: 'task-1' }),
    });

    expect(onStart).toHaveBeenCalledWith({ id: 'task-1' });
  });

  it('emits error events for invalid payloads and closes the source', () => {
    const client = new MediaGoClient();
    const emitter = client.streamEvents();
    const instances = getInstances();
    const source = instances.at(-1)!;

    const onError = vi.fn();
    emitter.on('error', onError);

    source.dispatch('download-start', { data: 'not-json' });
    expect(onError).toHaveBeenCalledTimes(1);

    emitter.close();
    expect(source.closed).toBe(true);
  });
});
