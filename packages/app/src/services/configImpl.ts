import { Config } from '../interfaces'
import Store, { Schema } from 'electron-store'
import { injectable } from 'inversify'
import { app } from 'electron'
import { dirname } from 'path'

export interface SchemaType {
  execDir: string
  userData: string
}

@injectable()
export default class ConfigImpl extends Store<SchemaType> implements Config {
  constructor () {
    const schema: Schema<SchemaType> = {
      execDir: {
        type: 'string',
        default: dirname(__dirname)
      },
      userData: {
        type: 'string',
        default: app.getPath('userData')
      }
    }

    super({ schema })
  }

  init (): void {
  }
}
