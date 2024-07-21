import { inject, injectable } from "inversify";
import { handle } from "../helper/index.ts";
import { type Controller } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import PlayerWindow from "../windows/PlayerWindow.ts";

@injectable()
export default class PlayerController implements Controller {
  constructor(
    @inject(TYPES.PlayerWindow)
    private readonly playerWindow: PlayerWindow,
  ) {}

  @handle("open-player-window")
  async openPlayerWindow() {
    this.playerWindow.showWindow();
  }
}
