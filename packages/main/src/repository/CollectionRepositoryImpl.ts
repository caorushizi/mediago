import { inject, injectable } from 'inversify'
import { Collection } from '../entity'
import { Repository } from 'typeorm/repository/Repository'
import { CollectionRepository, DataService } from '../interfaces'
import { TYPES } from '../types'

@injectable()
export default class CollectionRepositoryImpl implements CollectionRepository {
  private readonly repository: Repository<Collection>
  constructor (
    @inject(TYPES.DataService)
    private readonly dataSource: DataService
  ) {
    this.repository = this.dataSource.getRepository(Collection)
  }

  async insertCollection (item: Collection): Promise<Collection> {
    const result = await this.repository.insert(item)
    return result.raw
  }

  async getCollectionList (): Promise<Collection[]> {
    return await this.repository.find()
  }

  async updateCollection (
    id: number,
    video: Partial<Collection>
  ): Promise<void> {
    await this.repository.update({ id }, { ...video })
  }

  async findById (id: number): Promise<Collection | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async removeCollection (id?: number): Promise<void> {
    if (id != null) {
      const video = await this.repository.findOne({ where: { id } })
      if (video != null) {
        await this.repository.remove(video)
      }
    } else {
      const videos = await this.repository.find()
      await this.repository.remove(videos)
    }
  }
}
