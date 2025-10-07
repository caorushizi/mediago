import { provide } from "@inversifyjs/binding-decorators";
import { type Controller, OPEN_PLAYER_WINDOW } from "@mediago/shared-common";
import { handle, TYPES } from "@mediago/shared-node";
import { inject, injectable } from "inversify";
import PlayerWindow from "../windows/PlayerWindow";

@injectable()
@provide(TYPES.Controller)
export default class PlayerController implements Controller {
  constructor(
    @inject(PlayerWindow)
    private readonly playerWindow: PlayerWindow,
  ) {}

  @handle(OPEN_PLAYER_WINDOW)
  async openPlayerWindow() {
    this.playerWindow.showWindow();
  }
}
