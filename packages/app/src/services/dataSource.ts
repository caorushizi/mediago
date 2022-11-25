import { Video } from '../entity/Video'
import { Collection } from '../entity/Collection'
import { DataSource, DataSourceOptions } from 'typeorm'
import { Config, DB } from '../interfaces'
import { inject, injectable } from 'inversify'
import { TYPES } from '../types'
import { resolve } from 'path'

@injectable()
export class Data extends DataSource implements DB {
  constructor (
    @inject(TYPES.Config) private readonly config: Config
  ) {
    const userData = config.get('userData')
    const dbConfig: DataSourceOptions = {
      type: 'sqlite',
      database: resolve(userData, 'app.db'),
      synchronize: true,
      logging: false,
      entities: [Video, Collection],
      migrations: [],
      subscribers: []
    }
    super(dbConfig)
  }

  async init (): Promise<void> {
    await this.initialize()
  }

  async getVideoList (): Promise<Video[]> {
    return await this.manager.find(Video)
  }
}
