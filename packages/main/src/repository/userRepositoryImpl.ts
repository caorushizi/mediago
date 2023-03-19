import { User } from "../entity/User";
import { inject, injectable } from "inversify";
import { DatabaseService, LoggerService, UserRepository } from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class UserRepositoryImpl implements UserRepository {
  constructor(
    @inject(TYPES.DatabaseService)
    private readonly dataService: DatabaseService,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService
  ) {
    // empty
  }

  init() {
    const user = new User();
    user.name = "caorushizi";
    this.dataService.manager.save(user);
  }
}
