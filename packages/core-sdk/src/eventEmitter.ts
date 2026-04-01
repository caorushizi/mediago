import {
  EventSource,
  ErrorEvent,
  type EventListenerOrEventListenerObject,
} from "eventsource";
import mitt, { type Emitter, type Handler as MittHandler } from "mitt";
import type {
  ConfigChangedPayload,
  TaskEventEmitter,
  TaskEventMap,
  TaskEventPayload,
  TaskFailedEventPayload,
} from "./types";

type TaskEventName = keyof TaskEventMap;
type InternalEventMap = TaskEventMap & {
  [key: string]: unknown;
  [key: number]: unknown;
  [key: symbol]: unknown;
};
type HandlerStore = Map<Function, MittHandler<unknown>>;

interface MessageEventLike {
  readonly data?: unknown;
  readonly type: string;
}

/**
 * Wraps an EventSource connection and re-emits typed task events.
 */
export class TaskStreamEventEmitter implements TaskEventEmitter {
  private readonly listeners: Array<{
    type: string;
    listener: EventListenerOrEventListenerObject;
  }> = [];
  private readonly emitter: Emitter<InternalEventMap>;
  private readonly handlerMap = new Map<TaskEventName, HandlerStore>();

  constructor(private readonly source: EventSource) {
    this.emitter = mitt<InternalEventMap>();
    this.attachSourceListeners();
  }

  on<TEventName extends TaskEventName>(
    eventName: TEventName,
    listener: (payload: TaskEventMap[TEventName]) => void,
  ): this {
    const handler: MittHandler<InternalEventMap[TEventName]> = (payload) =>
      listener(payload);
    this.trackHandler(eventName, listener, handler);
    this.emitter.on(eventName, handler);
    return this;
  }

  off<TEventName extends TaskEventName>(
    eventName: TEventName,
    listener: (payload: TaskEventMap[TEventName]) => void,
  ): this {
    const handler = this.untrackHandler(eventName, listener) as
      | MittHandler<InternalEventMap[TEventName]>
      | undefined;
    if (handler) {
      this.emitter.off(eventName, handler);
    }
    return this;
  }

  once<TEventName extends TaskEventName>(
    eventName: TEventName,
    listener: (payload: TaskEventMap[TEventName]) => void,
  ): this {
    const wrapped: MittHandler<InternalEventMap[TEventName]> = (payload) => {
      this.off(eventName, listener);
      listener(payload);
    };
    this.trackHandler(eventName, listener, wrapped);
    this.emitter.on(eventName, wrapped);
    return this;
  }

  emit<TEventName extends TaskEventName>(
    eventName: TEventName,
    payload: TaskEventMap[TEventName],
  ): boolean {
    this.emitter.emit(eventName, payload as InternalEventMap[TEventName]);
    return true;
  }

  removeAllListeners<TEventName extends TaskEventName>(
    eventName?: TEventName,
  ): this {
    if (eventName) {
      const handlers = this.handlerMap.get(eventName);
      if (!handlers) {
        return this;
      }
      for (const handler of handlers.values()) {
        this.emitter.off(eventName, handler as MittHandler<any>);
      }
      handlers.clear();
      this.handlerMap.delete(eventName);
      return this;
    }

    for (const [evtName, handlers] of this.handlerMap.entries()) {
      for (const handler of handlers.values()) {
        this.emitter.off(evtName, handler as MittHandler<any>);
      }
      handlers.clear();
    }
    this.handlerMap.clear();
    return this;
  }

  close(): void {
    for (const { type, listener } of this.listeners) {
      this.source.removeEventListener(type, listener);
    }
    this.listeners.length = 0;
    this.source.close();
    this.removeAllListeners();
  }

  private attachSourceListeners(): void {
    this.registerListener("open", ((event: Event) => {
      this.emit("open", event);
    }) as EventListenerOrEventListenerObject);

    this.registerListener("error", ((event: ErrorEvent) => {
      this.emit("error", event);
    }) as EventListenerOrEventListenerObject);

    const taskEvents: Array<
      Extract<
        TaskEventName,
        "download-start" | "download-success" | "download-stop"
      >
    > = ["download-start", "download-success", "download-stop"];

    for (const eventName of taskEvents) {
      this.registerListener(eventName, ((event: MessageEventLike) => {
        const payload = this.safeParse<TaskEventPayload>(event);
        if (payload) {
          this.emit(eventName, payload);
        }
      }) as EventListenerOrEventListenerObject);
    }

    this.registerListener("download-failed", ((event: MessageEventLike) => {
      const payload = this.safeParse<TaskFailedEventPayload>(event);
      if (payload) {
        this.emit("download-failed", payload);
      }
    }) as EventListenerOrEventListenerObject);

    this.registerListener("config-changed", ((event: MessageEventLike) => {
      const payload = this.safeParse<ConfigChangedPayload>(event);
      if (payload) {
        this.emit("config-changed", payload);
      }
    }) as EventListenerOrEventListenerObject);
  }

  private registerListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ): void {
    this.source.addEventListener(type, listener);
    this.listeners.push({ type, listener });
  }

  private safeParse<T>(event: MessageEventLike): T | null {
    if (typeof event.data !== "string" || event.data.length === 0) {
      return null;
    }

    try {
      return JSON.parse(event.data) as T;
    } catch {
      const errorEvent = new ErrorEvent("error", {
        message: `Failed to parse SSE payload for "${event.type}"`,
      });
      this.emit("error", errorEvent);
      return null;
    }
  }

  private trackHandler<TEventName extends TaskEventName>(
    eventName: TEventName,
    listener: (payload: TaskEventMap[TEventName]) => void,
    handler: MittHandler<InternalEventMap[TEventName]>,
  ): void {
    if (!this.handlerMap.has(eventName)) {
      this.handlerMap.set(eventName, new Map());
    }
    this.handlerMap
      .get(eventName)!
      .set(listener as unknown as Function, handler as MittHandler<unknown>);
  }

  private untrackHandler<TEventName extends TaskEventName>(
    eventName: TEventName,
    listener: (payload: TaskEventMap[TEventName]) => void,
  ): MittHandler<unknown> | undefined {
    const handlers = this.handlerMap.get(eventName);
    if (!handlers) {
      return undefined;
    }
    const handler = handlers.get(listener as unknown as Function);
    if (handler) {
      handlers.delete(listener as unknown as Function);
      if (handlers.size === 0) {
        this.handlerMap.delete(eventName);
      }
    }
    return handler;
  }
}
