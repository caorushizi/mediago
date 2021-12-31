import { version } from "../../../package.json";

const onEvent = (eventId: string, mapKv: any = {}): void => {
  try {
    window.TDAPP.onEvent(eventId, "", mapKv);
    console.log(`添加埋点成功：${eventId}`, mapKv);
  } catch (err) {
    console.warn(`添加埋点失败：${eventId}`, err);
  }
};

const init = (): void => {
  const appId = import.meta.env.VITE_APP_TDID;
  let vn = `${version}开发版`;
  const vc = `${version}`;
  if (process.env.NODE_ENV === "production") {
    vn = `${version}生产版`;
  }
  const script = document.createElement("script");
  script.src = `https://jic.talkingdata.com/app/h5/v1?appid=${appId}&vn=${vn}&vc=${vc}`;
  const headElement = document.getElementsByTagName("head")[0];
  headElement.appendChild(script);
};

export default { onEvent, init };
