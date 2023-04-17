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
    const headElement = document.getElementsByTagName("head")[0];
    headElement.appendChild(script);
  }

  onEvent(eventId: string, mapKv: Record<string, string> = {}) {
    window.TDAPP.onEvent(eventId, "", mapKv);
  }

  downloadFailed = () => this.onEvent("下载页面-下载视频失败");
  downloadSuccess = () => this.onEvent("下载页面-下载视频成功");
  openHelpPage = () => this.onEvent("下载页面-打开使用帮助");
  startDownload = () => this.onEvent("资源下载-下载按钮");
}

const tdApp = new TDEvent();
export { tdApp };
