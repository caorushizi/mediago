import { inject, injectable } from 'inversify'
import { app, BrowserWindow } from 'electron'
import { TYPES } from '../types'
import { Config, DB, MainWindow, MyApp } from '../interfaces'

@injectable()
export class CoreApp implements MyApp {
  private readonly app: Electron.App
  constructor (
    @inject(TYPES.DB) private readonly db: DB,
    @inject(TYPES.MainWindow) private readonly mainWindow: MainWindow,
    @inject(TYPES.Config) private readonly config: Config
  ) {
    this.app = app

    this.app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit()
    })
    this.app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow.init().then(r => r).catch(e => e)
      }
    })
  }

  async init (): Promise<void> {
    await Promise.all([
      this.db.init(),
      this.app.whenReady()
    ])
    this.config.init()
    await this.mainWindow.init()
  }
}
