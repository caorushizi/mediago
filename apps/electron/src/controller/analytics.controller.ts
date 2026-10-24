import { join } from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import {
  type AnalyticsConsent,
  type Controller,
  IPC,
  IpcEvent,
} from "@mediago/common";
import { app, BrowserWindow, type IpcMainInvokeEvent } from "electron";
import { injectable } from "inversify";
import { handle } from "../core/decorators";
import { AnalyticsConsentStore } from "../services/analytics-consent-store";
import { TYPES } from "../types/symbols";

@injectable()
@provide(TYPES.Controller)
export default class AnalyticsController implements Controller {
  private get store() {
    // Shared with the NSIS page, independent of Core/server configuration.
    return new AnalyticsConsentStore(
      join(app.getPath("appData"), "MediaGo", "analytics-consent"),
    );
  }

  @handle(IPC.analytics.getConsent)
  getConsent(): AnalyticsConsent {
    return this.store.get();
  }

  @handle(IPC.analytics.setConsent)
  setConsent(_event: IpcMainInvokeEvent, enabled: boolean): AnalyticsConsent {
    const consent = this.store.set(enabled);
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed())
        window.webContents.send(IpcEvent.app.analyticsConsentChanged, consent);
    }
    return consent;
  }
}
