class APApp {
  async init() {
    try {
      const id = (await window.electron.getMachineId()) as any;
      if (id.code !== 0) return;

      window.aplus_queue = window.aplus_queue || [];
      const script = document.getElementsByTagName("script")[0];

      const ap = document.createElement("script");
      ap.async = true;
      ap.id = "beacon-aplus";
      ap.src = "https://d.alicdn.com/alilog/mlog/aplus/203467608.js";
      script.parentNode.insertBefore(ap, script);

      window.aplus_queue.push({
        action: "aplus.setMetaInfo",
        arguments: ["appKey", import.meta.env.APP_APLUS_APPID],
      });
      window.aplus_queue.push({
        action: "aplus.setMetaInfo",
        arguments: ["aplus-waiting", "MAN"],
      });
      window.aplus_queue.push({
        action: "aplus.setMetaInfo",
        arguments: ["DEBUG", import.meta.env.MODE === "development"],
      });
      window.aplus_queue.push({
        action: "aplus.setMetaInfo",
        arguments: ["aplus-idtype", "uuid"],
      });
      window.aplus_queue.push({
        action: "aplus.setMetaInfo",
        arguments: ["uuid", id.data],
      });
    } catch (e) {
      // empty
    }
  }

  sendPV() {
    try {
      const { aplus_queue } = window;
      aplus_queue.push({
        action: "aplus.sendPV",
        arguments: [{ is_auto: false }], // 此处上报的数据暂时在后台没有展示
      });
    } catch (e) {
      // empty
    }
  }

  record(event: string, params: Record<string, string> = {}) {
    try {
      const { aplus_queue } = window;
      aplus_queue.push({
        action: "aplus.record",
        arguments: [event, "CLK", params],
      });
    } catch (e) {
      // empty
    }
  }
}

const apApp = new APApp();
export { apApp };
