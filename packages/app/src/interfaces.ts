import Store from 'electron-store'
import { SchemaType } from './services/configImpl'

export interface DB {
  init: () => Promise<void>
}

export interface MyApp {
  init: () => Promise<void>
}

export interface MainWindow {
  init: () => Promise<void>
}

export interface Config extends Store<SchemaType> {
  init: () => void
}
