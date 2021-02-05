const onEvent = (eventId, label, mapKv) => {
  try {
    console.log(eventId);
    window.TDAPP.onEvent(eventId, label, mapKv);
  } catch (err) {
    console.log(`${eventId}=>err`, err);
  }
};

const test = "test";

export { onEvent, test };
