import { inject, injectable } from 'inversify'
import { app, BrowserWindow, ipcMain } from 'electron'
import { TYPES } from '../types'
import { Config, DB, MainWindow, MyApp } from '../interfaces'

@injectable()
export class CoreApp implements MyApp {
  constructor (
    @inject(TYPES.DB) private readonly db: DB,
    @inject(TYPES.MainWindow) private readonly mainWindow: MainWindow,
    @inject(TYPES.Config) private readonly config: Config
  ) {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') app.quit()
    })
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow.init().then(r => r).catch(e => e)
      }
    })
  }

  async init (): Promise<void> {
    await Promise.all([
      this.db.init(),
      app.whenReady()
    ])
    this.config.init()
    await this.mainWindow.init()

    ipcMain.handle('my-invokable-ipc', async (event, path: string, data: any) => {

    })
  }
}
