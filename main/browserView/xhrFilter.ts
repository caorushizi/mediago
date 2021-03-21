import { getType } from "mime";
import logger from "../utils/logger";
import windowManager from "../window/windowManager";
import { WindowName } from "../window/variables";

class XhrFilter {
  // 当请求即将发生时
  beforeRequest() {}
  // 一旦请求头可用，在发送 HTTP 请求之前，listener 将以
  // listener(details, callback) 的形式被调用。
  // 这可能发生在对服务器进行 TCP 连接之后
  // ，但在发送任何HTTP数据之前。
  beforeSendHeaders(
    details: Electron.OnBeforeSendHeadersListenerDetails,
    callback: (beforeSendResponse: Electron.BeforeSendResponse) => void
  ) {
    const m3u8Reg = /\.m3u8$/;
    const tsReg = /\.ts$/;
    let cancel = false;
    const myURL = new URL(details.url);
    console.log(myURL.pathname, getType(myURL.pathname));
    if (m3u8Reg.test(myURL.pathname)) {
      logger.info("在窗口中捕获 m3u8 链接: ", details.url);
      const { webContents } = windowManager.get(WindowName.MAIN_WINDOW) ?? {};
      webContents.send("m3u8", {
        title: webContents.getTitle(),
        requestDetails: details,
      });
    } else if (tsReg.test(myURL.pathname)) {
      cancel = true;
    }
    callback({
      cancel,
      requestHeaders: details.requestHeaders,
    });
  }
  // 在请求发送到服务器之前，listener将以listener(details)的形式被调用
  // ，在该侦听器被出发前，上一个对 onBeforeSendHeaders
  // 响应的修改是可见的。
  sendHeaders() {}
  // 当HTTP请求接收到报头后，会通过调用 listener(details, callback)
  // 方法来触发listener。
  // The callback has to be called with a response object.
  headersReceived() {}
  // 当收到响应体的第一个字节时， 将以 listener(details) 的形式来调用 listener。
  // 对于 HTTP 请求而言，这意味着此时 HTTP 状态行和回应头已经可以读取了。
  responseStarted() {}
  // 当服务器的初始重定向即将发生时，将以 listener(details)的方式调用listener。
  beforeRedirect() {}
  // 当请求完成时，将以 listener(details)的方式调用listener。
  completed() {}
  // 当发生错误时，将以 listener(details)的方式调用listener。
  errorOccurred() {}
}

export default XhrFilter;
