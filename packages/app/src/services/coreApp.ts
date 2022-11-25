import { inject, injectable } from 'inversify'
import { app, BrowserWindow, ipcMain } from 'electron'
import { TYPES } from '../types'
import { Browser, Config, DB, MainWindow, MyApp, View } from '../interfaces'
import { GET_VIDEO_LIST } from '../../channels'

@injectable()
export default class CoreApp implements MyApp {
  constructor (
    @inject(TYPES.DB) private readonly db: DB,
    @inject(TYPES.View) private readonly browserView: View,
    @inject(TYPES.MainWindow) private readonly mainWindow: MainWindow,
    @inject(TYPES.Browser) private readonly browser: Browser,
    @inject(TYPES.Config) private readonly config: Config
  ) {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit()
    })
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow
          .init()
          .then((r) => r)
          .catch((e) => e)
      }
    })
  }

  async init (): Promise<void> {
    await Promise.all([this.db.init()])
    this.mainWindow.show()
    this.browser.show()
    this.config.init()
    await this.mainWindow.init()
    await this.browser.init()

    this.browser.setBrowserView(this.browserView.view)
    console.log(this.browserView)
    await this.browserView.init()

    ipcMain.on('change-window-size', (e, args) => {
      console.log(args)
      this.browserView.view.setBounds({
        x: 50,
        y: 30,
        height: args.height,
        width: args.width
      })
    })

    ipcMain.handle(GET_VIDEO_LIST, () => {})
  }
}
