class TDEvent {
  private enabled = false;
  private script: HTMLScriptElement | undefined;
  private readonly appId = import.meta.env.APP_TD_APPID;
  private readonly version = import.meta.env.APP_VERSION;

  get loaded() {
    return this.script !== undefined;
  }

  init(consented = false) {
    if (consented !== true) return;
    this.enabled = true;
    const appId = typeof this.appId === "string" ? this.appId.trim() : "";
    if (!appId || this.script) return;
    const script = document.createElement("script");
    script.src = `https://jic.talkingdata.com/app/h5/v1?appid=${encodeURIComponent(appId)}&vn=${encodeURIComponent(this.version ?? "")}&vc=${encodeURIComponent(this.version ?? "")}`;
    script.async = true;
    script.referrerPolicy = "no-referrer";
    this.script = script;
    document.head.appendChild(script);
  }

  disable() {
    this.enabled = false;
    this.script?.remove();
    window.TDAPP = undefined;
  }

  onEvent(eventId: string, _mapKv: Record<string, string> = {}) {
    if (!this.enabled || !this.script) return;
    try {
      // Count feature usage without application-provided machine/task IDs,
      // routes, download URLs, filenames or other arbitrary event parameters.
      window.TDAPP?.onEvent(eventId, "", {});
    } catch {
      // Statistics must never interrupt downloads.
    }
  }
}

const tdApp = new TDEvent();
export { tdApp };
