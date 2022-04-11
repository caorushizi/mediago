import request from "./request";

const urlReg = /^(https?:\/\/(([a-zA-Z0-9]+-?)+[a-zA-Z0-9]+\.)+[a-zA-Z]+)(:\d+)?(\/.*)?(\?.*)?(#.*)?$/;
export const isUrl = (url: string): boolean => urlReg.test(url);

export { request };
