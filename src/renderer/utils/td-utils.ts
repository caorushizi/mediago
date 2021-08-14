import tdApp from "renderer/utils/td";

const onEvent = {
  browserPageGoBack: () => tdApp.onEvent("浏览器页面-点击返回按钮"),
  browserPageReload: () => tdApp.onEvent("浏览器页面-点击刷新按钮"),
  mainPageDownloadFail: (kv: any) => tdApp.onEvent("下载页面-下载视频失败", kv),
  mainPageDownloadSuccess: (kv: any) =>
    tdApp.onEvent("下载页面-下载视频成功", kv),
  mainPageOpenBrowserPage: () => tdApp.onEvent("下载页面-打开浏览器页面"),
  // ===================================
  mainPageNewSource: () => tdApp.onEvent("下载页面-新建下载"),
  mainPageOpenLocalPath: () => tdApp.onEvent("下载页面-打开本地路径"),
  mainPageHelp: () => tdApp.onEvent("下载页面-打开使用帮助"),
  tableStartDownload: () => tdApp.onEvent("资源表格-下载按钮"),
  tableOpenDetail: () => tdApp.onEvent("资源表格-详情按钮"),
  tableReNewStatus: () => tdApp.onEvent("资源表格-重置状态"),
  mainPageOpenComment: () => tdApp.onEvent("下载页面-点击评论反馈"),
  mainPageSourceCode: () => tdApp.onEvent("下载页面-源码地址"),
  mainUpdateLog: () => tdApp.onEvent("下载页面-更新日志"),
  toFavPage: () => tdApp.onEvent("下载页面-点击切换收藏页面"),
  toSettingPage: () => tdApp.onEvent("下载页面-点击切换设置页面"),
  toMainPage: () => tdApp.onEvent("下载页面-点击切换主页面"),
  favPageAddFav: () => tdApp.onEvent("收藏页面-添加收藏"),
  favPageOpenLink: () => tdApp.onEvent("收藏页面-打开链接"),
  favPageDeleteLink: () => tdApp.onEvent("收藏页面-删除链接"),
  addSourceDownload: () => tdApp.onEvent("新建下载-立即下载"),
  addSourceAddSource: () => tdApp.onEvent("新建下载-添加资源"),
};

export default onEvent;
