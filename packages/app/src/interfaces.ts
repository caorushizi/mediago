import { BrowserView, BrowserWindow } from 'electron'
import Store from 'electron-store'
import { SchemaType } from './services/configImpl'
import { Video } from './entity/Video'

export interface DB {
  init: () => Promise<void>
  getVideoList: () => Promise<Video[]>
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
