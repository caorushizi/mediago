import { inject, injectable } from "inversify";
import { handle } from "../helper/index.ts";
import { type Controller } from "@mediago/shared/common";
import { TYPES } from "@mediago/shared/node";
import PlayerWindow from "../windows/PlayerWindow.ts";

@injectable()
export default class PlayerController implements Controller {
  constructor(
    @inject(TYPES.PlayerWindow)
    private readonly playerWindow: PlayerWindow
  ) {}

  @handle("open-player-window")
  async openPlayerWindow() {
    this.playerWindow.showWindow();
  }
}
