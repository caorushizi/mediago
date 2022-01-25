import { version } from "../../../package.json";
import store from "renderer/store";

const isProd = process.env.NODE_ENV === "production";

class TDEvent {
  appId?: string | boolean;
  vn: string;
  vc: string;

  constructor() {
    this.appId = import.meta.env.VITE_APP_TDID;
    this.vn = isProd ? `${version}生产版` : `${version}开发版`;
    this.vc = `${version}`;
  }

  init() {
    const script = document.createElement("script");
    script.src = `https://jic.talkingdata.com/app/h5/v1?appid=${this.appId}&vn=${this.vn}&vc=${this.vc}`;
    const headElement = document.getElementsByTagName("head")[0];
    headElement.appendChild(script);
  }

  onEvent(eventId: string, mapKv: any = {}) {
    const { settings } = store.getState();
    if (settings.statistics) {
      window.TDAPP.onEvent(eventId, "", mapKv);
    }
  }
}

export default new TDEvent();
