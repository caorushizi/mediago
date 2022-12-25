const urlReg =
  /^(https?:\/\/(([a-zA-Z0-9]+-?)+[a-zA-Z0-9]+\.)+[a-zA-Z]+)(:\d+)?(\/.*)?(\?.*)?(#.*)?$/;
const isUrl = (url: string): boolean => urlReg.test(url);

/**
 * 根据名字提取颜色
 * @param name 名字
 */
const extractColorByName = (name: string): string => {
  // 随机生成十六进制颜色
  let hex = Math.floor(Math.random() * 16777216).toString(16);
  // 生成ffffff以内16进制数
  while (hex.length < 6) {
    // while循环判断hex位数，少于6位前面加0凑够6位
    hex = "0" + hex;
  }
  return "#" + hex; // 返回‘#'开头16进制颜色
};

const processHeaders = (headersStr: string): Record<string, string> =>
  headersStr.split("\n").reduce((prev: Record<string, string>, cur) => {
    const colonIndex = cur.indexOf(":");
    const key = cur.slice(0, colonIndex).trim();
    prev[key] = cur.slice(colonIndex + 1).trim();
    return prev;
  }, {});

export { onEvent, tdApp } from "./talkingdata";
export { downloaderOptions, helpUrl } from "./variables";
export { isUrl, extractColorByName };
