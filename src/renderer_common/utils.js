const onEvent = (eventId, label, mapKv) => {
  try {
    window.TDAPP.onEvent(eventId, label, mapKv);
    console.log("埋点成功：", eventId, label, mapKv);
  } catch (err) {
    console.log(`埋点失败：${eventId}`, err);
  }
};

const test = "test";

export { onEvent, test };
