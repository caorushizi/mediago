const onEvent = (eventId, mapKv = {}) => {
  try {
    window.TDAPP.onEvent(eventId, "", mapKv);
  } catch (err) {
    console.log("添加埋点失败：", err);
  }
};

const init = () => {
  const appId = process.env.TD_APP_ID;
  const vn = process.env.TD_APP_VN;
  const vc = process.env.TD_APP_VC;
  const script = document.createElement("script");
  script.src = `https://jic.talkingdata.com/app/h5/v1?appid=${appId}&vn=${vn}&vc=${vc}`;
  console.log(
    `https://jic.talkingdata.com/app/h5/v1?appid=${appId}&vn=${vn}&vc=${vc}`
  );
  const headElement = document.getElementsByTagName("head")[0];
  headElement.appendChild(script);
};

export default { onEvent, init };
