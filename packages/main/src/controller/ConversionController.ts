import { inject, injectable } from "inversify";
import { ConversionPagination, type Controller } from "../interfaces.ts";
import { TYPES } from "../types.ts";
import ConversionRepository from "../repository/ConversionRepository.ts";
import { handle } from "../helper/decorator.ts";
import { Conversion } from "../entity/Conversion.ts";
import { IpcMainEvent } from "electron/main";

@injectable()
export default class ConversionController implements Controller {
  constructor(
    @inject(TYPES.ConversionRepository)
    private readonly conversionRepository: ConversionRepository
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
