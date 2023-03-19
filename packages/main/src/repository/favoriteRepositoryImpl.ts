import { inject, injectable } from "inversify";
import {
  DatabaseService,
  FavoriteRepository,
  LoggerService,
} from "../interfaces";
import { TYPES } from "../types";
import { Favorite } from "entity/Favorite";

@injectable()
export default class FavoriteRepositoryImpl implements FavoriteRepository {
  constructor(
    @inject(TYPES.DatabaseService)
    private readonly dataService: DatabaseService,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService
  ) {
    // empty
  }

  init() {
    const user = new Favorite();
    user.title = "caorushizi";
    this.dataService.manager.save(user);
  }
}
