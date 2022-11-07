import { BrowserView, BrowserWindow } from 'electron'
import Store from 'electron-store'
import { SchemaType } from './services/configImpl'

export interface DB {
  init: () => Promise<void>
}

export interface MyApp {
  init: () => Promise<void>
}

export interface MainWindow extends BrowserWindow {
  init: () => Promise<void>
}

export interface Browser extends BrowserWindow {
  init: () => Promise<void>
}

export interface View {
  view: BrowserView
  init: () => Promise<void>
}

export interface Config extends Store<SchemaType> {
  init: () => void
}
