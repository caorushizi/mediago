import { provide } from "@inversifyjs/binding-decorators";
import {
  type Controller,
  ConversionPagination,
  ADD_CONVERSION,
  DELETE_CONVERSION,
  GET_CONVERSIONS,
} from "@mediago/shared-common";
import type { Conversion } from "@mediago/shared-node";
import { type ConversionService, handle, TYPES } from "@mediago/shared-node";
import type { IpcMainEvent } from "electron/main";
import { inject, injectable } from "inversify";

@injectable()
@provide(TYPES.Controller)
export default class ConversionController implements Controller {
  constructor(
    @inject(TYPES.ConversionService)
    private readonly conversionService: ConversionService,
  ) {}

  @handle(GET_CONVERSIONS)
  async getConversions(e: IpcMainEvent, pagination: ConversionPagination) {
    return await this.conversionService.getConversions(pagination);
  }

  @handle(ADD_CONVERSION)
  async addConversion(e: IpcMainEvent, conversion: Conversion) {
    return await this.conversionService.addConversion(conversion);
  }

  @handle(DELETE_CONVERSION)
  async deleteConversion(e: IpcMainEvent, id: number) {
    return await this.conversionService.deleteConversion(id);
  }
}
