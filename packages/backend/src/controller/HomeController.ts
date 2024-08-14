import { inject, injectable } from "inversify";
import { type Controller } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import FavoriteRepository from "../repository/FavoriteRepository.ts";

@injectable()
export default class HomeController implements Controller {
  private sharedState: Record<string, unknown> = {};

  constructor(
    @inject(TYPES.FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}
}
