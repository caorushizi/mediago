class TDEvent {
  appId?: string | boolean;
  vn?: string;
  vc?: string;

  constructor() {
    this.appId = import.meta.env.APP_TD_APPID;
    this.vn = import.meta.env.APP_VERSION;
    this.vc = import.meta.env.APP_VERSION;
  }

  init() {
    const script = document.createElement("script");
    script.src = `https://jic.talkingdata.com/app/h5/v1?appid=${this.appId}&vn=${this.vn}&vc=${this.vc}`;
    script.async = true;
    const headElement = document.getElementsByTagName("head")[0];
    headElement.appendChild(script);
  }

  onEvent(eventId: string, mapKv: Record<string, string> = {}) {
    try {
      window.TDAPP?.onEvent(eventId, "", mapKv);
    } catch (e) {
      // empty
    }
  }
}

const tdApp = new TDEvent();
export { tdApp };
