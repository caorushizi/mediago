import { provide } from "@inversifyjs/binding-decorators";
import type { Controller, ConversionPagination } from "@mediago/shared/common";
import { ConversionService, handle, TYPES } from "@mediago/shared/node";
import type { Conversion } from "@mediago/shared/node";
import type { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";

@injectable()
@provide(TYPES.Controller)
export default class ConversionController implements Controller {
  constructor(
    @inject(TYPES.ConversionService)
    private readonly conversionService: ConversionService,
  ) {}

  @handle("get-conversions")
  async getConversions(e: IpcMainEvent, pagination: ConversionPagination) {
    return await this.conversionService.getConversions(pagination);
  }

  @handle("add-conversion")
  async addConversion(e: IpcMainEvent, conversion: Conversion) {
    return await this.conversionService.addConversion(conversion);
  }

  @handle("delete-conversion")
  async deleteConversion(e: IpcMainEvent, id: number) {
    return await this.conversionService.deleteConversion(id);
  }
}
