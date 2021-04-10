const onEvent = (eventId: string, mapKv: any = {}) => {
  try {
    // @ts-ignore
    window.TDAPP.onEvent(eventId, "", mapKv);
    console.log("添加埋点成功：", eventId, mapKv);
  } catch (err) {
    console.log("添加埋点失败：", err);
  }
};

const init = () => {
  const appId = import.meta.env.VITE_APP_TDID;
  const vn = import.meta.env.VITE_APP_TDVN;
  const vc = import.meta.env.VITE_APP_TDVC;
  const script = document.createElement("script");
  const src = `https://jic.talkingdata.com/app/h5/v1?appid=${appId}&vn=${vn}&vc=${vc}`;
  script.src = src;
  console.log("埋点地址是：", src);
  const headElement = document.getElementsByTagName("head")[0];
  headElement.appendChild(script);
};

export default { onEvent, init };
