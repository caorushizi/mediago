import { inject, injectable } from "inversify";
import { ConversionPagination, type Controller } from "@mediago/shared/common";
import { TYPES, ConversionRepository, Conversion } from "@mediago/shared/node";
import { handle } from "../helper/index.ts";
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
