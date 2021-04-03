// 从主进程中想渲染进程发送的参数
declare interface SourceUrl {
  title: string;
  detail: Electron.OnBeforeSendHeadersListenerDetails;
}

declare function SourceUrlToRenderer(
  event: Electron.IpcRendererEvent,
  url: SourceUrl
): void;

export { SourceUrl, SourceUrlToRenderer };
