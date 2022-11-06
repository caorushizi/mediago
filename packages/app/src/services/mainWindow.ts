import { BrowserWindow } from 'electron'
import { resolve } from 'path'
import { inject, injectable } from 'inversify'
import { Config, MainWindow } from '../interfaces'
import { TYPES } from '../types'

@injectable()
export default class MainWindowImpl implements MainWindow {
  constructor (
    @inject(TYPES.Config) private readonly config: Config
  ) {
  }

  async init (): Promise<void> {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: resolve(this.config.get('execDir'), 'preload/index.js')
      }
    })

    await mainWindow.loadURL('http://localhost:5173')
  }
}
