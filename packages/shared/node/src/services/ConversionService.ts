import { provide } from "@inversifyjs/binding-decorators";
import type { ConversionPagination } from "@mediago/shared-common";
import { inject, injectable } from "inversify";
import type { Conversion } from "../dao/entity/Conversion";
import ConversionRepository from "../dao/repository/ConversionRepository";
import { TYPES } from "../types";

@injectable()
@provide(TYPES.ConversionService)
export class ConversionService {
  constructor(
    @inject(ConversionRepository)
    private readonly conversionRepository: ConversionRepository,
  ) {}

  async getConversions(pagination: ConversionPagination) {
    return await this.conversionRepository.getConversions(pagination);
  }

  async addConversion(conversion: Conversion) {
    return await this.conversionRepository.addConversion(conversion);
  }

  async deleteConversion(id: number) {
    return await this.conversionRepository.deleteConversion(id);
  }
}
