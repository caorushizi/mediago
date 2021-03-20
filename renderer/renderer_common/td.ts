const onEvent = (eventId: string, mapKv: any = {}) => {
  try {
    // @ts-ignore
    window.TDAPP.onEvent(eventId, "", mapKv);
  } catch (err) {
    console.log("添加埋点失败：", err);
  }
};

const init = () => {
  const appId = import.meta.env.VITE_APP_TDID;
  const vn = import.meta.env.VITE_APP_TDVN;
  const vc = import.meta.env.VITE_APP_TDVC;
  const script = document.createElement("script");
  script.src = `https://jic.talkingdata.com/app/h5/v1?appid=${appId}&vn=${vn}&vc=${vc}`;
  const headElement = document.getElementsByTagName("head")[0];
  headElement.appendChild(script);
};

export default { onEvent, init };
