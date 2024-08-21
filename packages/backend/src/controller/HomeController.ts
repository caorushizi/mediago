import { inject, injectable } from "inversify";
import { type Controller } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import FavoriteRepository from "../repository/FavoriteRepository.ts";
import { get } from "../helper/decorator.ts";

@injectable()
export default class HomeController implements Controller {
  constructor(
    @inject(TYPES.FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  @get("/")
  async getFavorites() {
    return false;
  }
}
