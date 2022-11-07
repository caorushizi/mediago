import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import { resolve } from 'path'
import { inject, injectable } from 'inversify'
import { Browser, Config } from '../interfaces'
import { TYPES } from '../types'

@injectable()
export default class BrowserWindowImpl extends BrowserWindow implements Browser {
  constructor (
    @inject(TYPES.Config) private readonly config: Config
  ) {
    const options: BrowserWindowConstructorOptions = {
      width: 800,
      height: 600,
      webPreferences: {
        preload: resolve(config.get('execDir'), 'preload/index.js')
      }
    }
    super(options)
  }

  async init (): Promise<void> {
    await this.loadURL('http://localhost:5173/browser')
  }
}
