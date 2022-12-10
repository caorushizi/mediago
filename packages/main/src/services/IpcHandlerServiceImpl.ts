import { Controller, IpcHandlerService } from "../interfaces";
import { inject, injectable, multiInject } from "inversify";
import { TYPES } from "../types";

@injectable()
export default class IpcHandlerServiceImpl implements IpcHandlerService {
  constructor(
    @multiInject(TYPES.Controller) private controllers: Controller[]
  ) {}
  init(): void {
    // empty
  }
}
