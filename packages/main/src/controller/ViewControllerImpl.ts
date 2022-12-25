import { IpcMainInvokeEvent } from 'electron'
import { inject, injectable } from 'inversify'
import { TYPES } from '../types'
import {
  BrowserViewService,
  BrowserWindowService,
  Controller
} from '../interfaces'
import { on } from '../decorator/ipc'

@injectable()
export default class ViewControllerImpl implements Controller {
  constructor (
    @inject(TYPES.BrowserViewService)
    private readonly browserWindow: BrowserWindowService,
    @inject(TYPES.BrowserViewService)
    private readonly browserView: BrowserViewService
  ) {}

  test = 123

  @on('set-browser-view-bounds')
  setBrowserViewBounds (e: IpcMainInvokeEvent, rect: any): void {
    this.browserView?.setBounds(rect)
  }

  @on('browser-view-go-back')
  browserViewGoBack (): void {
    const canGoBack = this.browserView.webContents.canGoBack()
    if (canGoBack) this.browserView.webContents.goBack()
  }

  @on('browser-view-reload')
  browserViewReload (): void {
    this.browserView.webContents.reload()
  }

  @on('browser-view-load-url')
  browserViewLoadUrl (e: IpcMainInvokeEvent, url: string): void {
    void this.browserView.webContents.loadURL(url || 'https://baidu.com')
  }
}
