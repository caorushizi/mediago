import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Controller, CollectionRepository } from "../interfaces";
import { handle } from "../decorator/ipc";
import { Collection } from "../entity";
import { IpcMainInvokeEvent } from "electron";

@injectable()
export default class CollectionControllerImpl implements Controller {
  constructor(
    @inject(TYPES.CollectionRepository)
    private readonly videoRepository: CollectionRepository
  ) {}

  @handle("get-collection-list")
  async getCollectionList(): Promise<Collection[]> {
    return await this.videoRepository.getCollectionList();
  }

  @handle("add-collection")
  async addCollection(
    event: IpcMainInvokeEvent,
    video: Collection
  ): Promise<Collection> {
    return await this.videoRepository.insertCollection(video);
  }

  @handle("update-collection")
  async updateCollection(
    event: IpcMainInvokeEvent,
    id: number,
    video: Partial<Collection>
  ) {
    return await this.videoRepository.updateCollection(id, video);
  }

  @handle("remove-collection")
  async removeCollection(event: IpcMainInvokeEvent, id?: number) {
    return await this.videoRepository.removeCollection(id);
  }
}
