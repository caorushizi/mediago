// 从主进程中想渲染进程发送的参数
declare interface SourceUrl {
  title: string;
  details: Electron.OnBeforeSendHeadersListenerDetails;
}

declare function SourceUrlToRenderer(
  event: Electron.IpcRendererEvent,
  url: SourceUrl
): void;

declare interface Fav {
  url: string;
  title: string;
}

export { SourceUrl, SourceUrlToRenderer, Fav };
