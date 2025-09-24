export type IpcMainEvent = {
  sender?: { send: (channel: string, data: unknown) => void };
};

export const clipboard = {
  writeText: (_text: string) => undefined,
};

export const dialog = {
  async showOpenDialog(): Promise<{ canceled: boolean; filePaths: string[] }> {
    return { canceled: true, filePaths: [] };
  },
};

export class MenuItem {}

export type MenuItemConstructorOptions = {
  label?: string;
  type?: "separator";
  click?: () => void;
};

export class Menu {
  static buildFromTemplate(_template: Array<MenuItemConstructorOptions | MenuItem>) {
    return new Menu();
  }

  popup(): void {
    // no-op
  }
}

export const nativeTheme = {
  themeSource: "system" as string,
};

export const shell = {
  async openPath(_dir: string): Promise<string> {
    return "";
  },
  async openExternal(_url: string): Promise<void> {
    // no-op
  },
};

export const app = {
  getAppPath(): string {
    return process.cwd();
  },
  getPath(_name: string): string {
    return process.cwd();
  },
  whenReady(): Promise<void> {
    return Promise.resolve();
  },
  on(_event: string, _handler: (...args: unknown[]) => void): void {
    // no-op
  },
};

export interface BrowserWindowConstructorOptions {
  [key: string]: unknown;
}

export class BrowserWindow {
  public webContents = {
    openDevTools: () => undefined,
    on: (_event: string, _listener: (...args: unknown[]) => void) => undefined,
    stop: () => undefined,
    loadURL: (_url: string) => Promise.resolve(),
    getTitle: () => "",
    getURL: () => "",
    setWindowOpenHandler: (_handler: (...args: unknown[]) => unknown) => ({
      action: "deny" as const,
    }),
    send: (_channel: string, _data: unknown) => undefined,
  };

  public contentView = {
    addChildView: (_view: unknown) => undefined,
    removeChildView: (_view: unknown) => undefined,
  };

  loadURL(_url: string): Promise<void> {
    return Promise.resolve();
  }

  once(_event: string, _listener: (...args: unknown[]) => void): void {}

  on(_event: string, _listener: (...args: unknown[]) => void): void {}

  show(): void {}

  hide(): void {}

  close(): void {}

  getBounds(): { x: number; y: number; width: number; height: number } {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  setBounds(_bounds: { x: number; y: number; width: number; height: number }): void {}

  setBackgroundColor(_color: string): void {}
}

export class Notification {
  show(): void {}
}

export class WebContentsView {
  public webContents = {
    openDevTools: () => undefined,
    on: (_event: string, _listener: (...args: unknown[]) => void) => undefined,
    stop: () => undefined,
    loadURL: (_url: string) => Promise.resolve(),
    getTitle: () => "",
    getURL: () => "",
    setWindowOpenHandler: (_handler: (...args: unknown[]) => unknown) => ({
      action: "deny" as const,
    }),
    send: (_channel: string, _data: unknown) => undefined,
    executeJavaScript: async (_code: string) => undefined,
    setAudioMuted: (_muted: boolean) => undefined,
    setUserAgent: (_agent: string) => undefined,
  };

  setBackgroundColor(_color: string): void {}

  setBounds(_bounds: { x: number; y: number; width: number; height: number }): void {}
}

export interface HandlerDetails {
  url: string;
}

export interface Event {
  preventDefault(): void;
}

const mockSession = {
  setProxy: async (_config: { proxyRules: string }) => undefined,
  clearCache: async () => undefined,
  clearStorageData: async () => undefined,
};

export const session = {
  fromPartition: (_partition: string) => mockSession,
};
