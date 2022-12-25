import { version } from '../../package.json'
import store from '../store'

const isDev = process.env.NODE_ENV === 'development'

class TDEvent {
  appId?: string | boolean
  vn: string
  vc: string

  constructor () {
    this.appId = import.meta.env.VITE_APP_TDID
    this.vn = isDev ? `${version}开发版` : `${version}生产版`
    this.vc = `${version}`
  }

  init () {
    const script = document.createElement('script')
    script.src = `https://jic.talkingdata.com/app/h5/v1?appid=${this.appId}&vn=${this.vn}&vc=${this.vc}`
    const headElement = document.getElementsByTagName('head')[0]
    headElement.appendChild(script)
  }

  onEvent (eventId: string, mapKv: any = {}) {
    if (!window.TDAPP && isDev) {
      console.warn('TDAPP 没有初始化')
    }
    const { settings } = store.getState()
    if (settings.statistics) {
      window.TDAPP?.onEvent(eventId, '', mapKv)
    }
  }
}
const tdApp = new TDEvent()

const onEvent = {
  browserPageGoBack: (): void => tdApp.onEvent('浏览器页面-点击返回按钮'),
  browserPageReload: (): void => tdApp.onEvent('浏览器页面-点击刷新按钮'),
  mainPageDownloadFail: (kv?: unknown): void =>
    tdApp.onEvent('下载页面-下载视频失败', kv),
  mainPageDownloadSuccess: (kv?: unknown): void =>
    tdApp.onEvent('下载页面-下载视频成功', kv),
  mainPageOpenBrowserPage: (): void => tdApp.onEvent('下载页面-打开浏览器页面'),
  mainPageNewSource: (): void => tdApp.onEvent('下载页面-新建下载'),
  mainPageHelp: (): void => tdApp.onEvent('下载页面-打开使用帮助'),
  tableStartDownload: (): void => tdApp.onEvent('资源表格-下载按钮'),
  tableReNewStatus: (): void => tdApp.onEvent('资源表格-重置状态'),
  toSettingPage: (): void => tdApp.onEvent('下载页面-点击切换设置页面'),
  toMainPage: (): void => tdApp.onEvent('下载页面-点击切换主页面'),
  favPageAddFav: (): void => tdApp.onEvent('收藏页面-添加收藏'),
  favPageOpenLink: (): void => tdApp.onEvent('收藏页面-打开链接'),
  favPageDeleteLink: (): void => tdApp.onEvent('收藏页面-删除链接'),
  addSourceDownload: (): void => tdApp.onEvent('新建下载-立即下载'),
  addSourceAddSource: (): void => tdApp.onEvent('新建下载-添加资源')
}

export { tdApp, onEvent }
