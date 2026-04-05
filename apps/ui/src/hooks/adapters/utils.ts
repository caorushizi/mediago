export interface IpcListener {
  on: (eventName: string, func: (...args: unknown[]) => void) => void;
  off: (eventName: string, func: (...args: unknown[]) => void) => void;
}
