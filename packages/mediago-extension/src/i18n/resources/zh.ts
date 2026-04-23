const resource = {
  popup: {
    header: "MediaGo 资源检测",
    clear: "清空",
    importAll: "导入全部",
    importAllWithCount: "导入全部（{{count}}）",
    settings: "设置",
    imported: "已导入 {{count}} 个任务",
    importFailed: "导入失败",
  },
  status: {
    detecting: "检测中",
    schemaMode: "Schema 模式",
    notConfigured: "未配置",
    connectionFailed: "连接失败",
  },
  empty: {
    title: "当前页面暂未检测到可下载资源。",
    hint: "浏览网页过程中命中规则时会自动出现在这里。",
  },
  source: {
    unnamed: "(未命名)",
    import: "导入",
  },
  options: {
    pageTitle: "MediaGo 扩展设置",
    language: {
      title: "界面语言",
      description:
        '影响 popup 与设置页的显示语言。选择"跟随系统"时按浏览器 UI 语言自动挑选。',
      system: "跟随系统",
      zh: "中文",
      en: "English",
      it: "Italiano",
    },
    server: {
      title: "调用方式",
      description:
        "扩展不会自动降级。选定模式后，调用失败会直接报错——如需切换请返回此页面手动更改。",
      modeSchemaTitle: "Desktop · Schema 协议",
      modeSchemaDesc:
        "通过 mediago-community:// 协议唤起桌面版（未运行时自动拉起）。仅适用于本机安装了 MediaGo Desktop 的用户。",
      modeDesktopHttpTitle: "Desktop · HTTP 本地接口",
      modeDesktopHttpDesc:
        "通过 {{base}} 与运行中的桌面版通信。要求 Desktop 处于运行状态，但无需授权弹窗。",
      modeDockerHttpTitle: "Docker / 自建服务 · HTTP",
      modeDockerHttpDesc:
        "连接远端 Docker 部署或任何自建 MediaGo 服务端。需要填写服务器地址；启用鉴权时额外填 API Key。",
      serverUrlLabel: "服务器 URL",
      serverUrlPlaceholder: "http://your-host:8899",
      apiKeyLabel: "API Key",
      apiKeyOptional: "（可选）",
      apiKeyPlaceholder: "留空则不发送 X-API-Key",
      schemaNoteLead: "通过 MediaGo 既有的",
      schemaNoteMid:
        '渲染路由协议调用桌面版。调用时会把当前 tab 跳到该协议 URL（参照 cat-catch 的做法），Chrome 首次弹出 "Open MediaGo-community?" 对话框，点',
      schemaAllow: "允许",
      schemaAlways: "总是允许",
      schemaAfter: "之后即可静默直通。",
      limitationLabel: "限制",
      limitationBody: "Schema 一次只能发送一条；批量请切 HTTP 模式。",
      desktopHttpNoteLead: "固定连接",
      desktopHttpNoteTail:
        '——桌面版随应用启动自动监听，点击"测试连接"可确认当前是否在线。',
    },
    importBehaviour: {
      title: "导入行为",
      descriptionLead: "这些选项通过 deeplink 查询串（",
      descriptionMid: "）或 HTTP body（",
      descriptionTail: "）告诉 MediaGo 收到任务后怎么处理。",
      downloadNowLabel: "立即开始下载",
      downloadNowDesc:
        "开：任务进队列并立刻开跑。关：仅加入下载列表，等用户手动触发。对 Schema 和 HTTP 两种模式都生效。",
      schemaSilentLabel: "静默导入（Schema 模式）",
      schemaSilentActive:
        "开：deeplink 携带 silent=1，MediaGo 收到即创建任务。关：MediaGo 会弹出下载表单让用户核对名字 / 类型 / 保存路径再提交。",
      schemaSilentInactive:
        "仅 Schema 模式生效 —— HTTP 模式没有桌面弹窗概念，总是静默。",
    },
    rules: {
      title: "嗅探规则",
      descriptionLead: "当前规则由",
      descriptionTail: "集中维护，桌面版和浏览器扩展共享同一份。",
      m3u8Label: "HLS / m3u8 流",
      directLabel: "直连媒体文件",
      bilibiliLabel: "Bilibili 视频页",
      youtubeLabel: "YouTube",
    },
  },
  common: {
    save: "保存",
    saved: "已保存",
    saveFailed: "保存失败",
    testConnection: "测试连接",
  },
  errors: {
    serverUrlRequired: "请先填写服务器 URL",
    dockerServerRequired: "Docker 模式必须填写服务器 URL",
    schemaBatchNotSupported:
      "Schema 模式一次只能导入一条；批量导入请切换到 HTTP 模式（Options 页）",
    schemaNoActiveTab: "当前窗口没有活动 tab，无法发起协议调用",
    schemaInvoked:
      "已唤起 mediago-community:// 协议，如 Desktop 窗口未出现请确认是否已安装",
    serverNotConfigured: "MediaGo 服务未配置",
    dockerNotConfigured: "Docker 模式未配置服务器地址，请先到设置页填写",
    unknown: "{{detail}}",
  },
};

export default resource;
export type ExtensionResources = typeof resource;
