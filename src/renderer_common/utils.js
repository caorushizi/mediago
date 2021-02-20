const onEvent = (eventId, label = "", mapKv = {}) => {
  try {
    window.TDAPP.onEvent(eventId, label, mapKv);
  } catch (err) {
    // eslint-disable-next-line no-empty
  }
};

const init = () => {
  const appId = process.env.TD_APP_ID;
  const vn = process.env.TD_APP_VN;
  const vc = process.env.TD_APP_VC;
  const script = document.createElement("script");
  script.src = `https://jic.talkingdata.com/app/h5/v1?appid=${appId}&vn=${vn}&vc=${vc}`;
  const headElement = document.getElementsByTagName("head")[0];
  headElement.appendChild(script);
};

const onPageStart = () => {};

const onPageEnd = () => {};

export default { onEvent, init, onPageStart, onPageEnd };
