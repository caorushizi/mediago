const onEvent = (eventId, label, mapKv) => {
  try {
    window.TDAPP.onEvent(eventId, label, mapKv);
  } catch (err) {
    // eslint-disable-next-line no-empty
  }
};

const test = "test";

export { onEvent, test };
