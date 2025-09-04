import { provide } from "@inversifyjs/binding-decorators";
import type { Controller, ConversionPagination } from "@mediago/shared/common";
import { type Conversion, ConversionRepository, TYPES } from "@mediago/shared/node";
import type { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";
import { handle } from "../helper/index";

@injectable()
@provide(TYPES.Controller)
export default class ConversionController implements Controller {
  constructor(
    @inject(ConversionRepository)
    private readonly conversionRepository: ConversionRepository,
  ) {}

  @handle("get-conversions")
  async getConversions(e: IpcMainEvent, pagination: ConversionPagination) {
    return await this.conversionRepository.getConversions(pagination);
  }

  @handle("add-conversion")
  async addConversion(e: IpcMainEvent, conversion: Conversion) {
    return await this.conversionRepository.addConversion(conversion);
  }

  @handle("delete-conversion")
  async deleteConversion(e: IpcMainEvent, id: number) {
    return await this.conversionRepository.deleteConversion(id);
  }
}
