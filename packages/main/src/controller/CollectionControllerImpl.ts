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
    private videoRepository: CollectionRepository
  ) {}
  @handle("get-collection-list")
  getCollectionList(): Promise<Collection[]> {
    return this.videoRepository.getCollectionList();
  }
  @handle("add-collection")
  addCollection(
    event: IpcMainInvokeEvent,
    video: Collection
  ): Promise<Collection> {
    return this.videoRepository.insertCollection(video);
  }

  @handle("update-collection")
  updateCollection(
    event: IpcMainInvokeEvent,
    id: number,
    video: Partial<Collection>
  ) {
    return this.videoRepository.updateCollection(id, video);
  }

  @handle("remove-collection")
  removeCollection(event: IpcMainInvokeEvent, id?: number) {
    return this.videoRepository.removeCollection(id);
  }
}
