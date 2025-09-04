import { provide } from "@inversifyjs/binding-decorators";
import type { Controller } from "@mediago/shared/common";
import { TYPES } from "@mediago/shared/node";
import { inject, injectable } from "inversify";
import { handle } from "../helper/index";
import PlayerWindow from "../windows/PlayerWindow";

@injectable()
@provide(TYPES.Controller)
export default class PlayerController implements Controller {
  constructor(
    @inject(PlayerWindow)
    private readonly playerWindow: PlayerWindow,
  ) {}

  @handle("open-player-window")
  async openPlayerWindow() {
    this.playerWindow.showWindow();
  }
}
